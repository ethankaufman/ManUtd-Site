import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type { Kick } from "@/lib/kicks";
import { buildBackdrop } from "./backdrop";
import { createFigure } from "./figure";
import { jointsAt, T_CONTACT, T_GOAL } from "./motion";

/**
 * The 3D reconstruction of one goal: a floodlit stadium end with the goal, a stylised player, the ball and its
 * trail. Drag to turn the view, scroll or pinch to zoom.
 * Positions: the goal line is z = 0 and the pitch runs along +z; x is sideways; y is up (metres).
 */

const RED = 0xda291c;
const BALL_R = 0.11;

/** A flat white line painted on the grass, as a thin box (WebGL lines are always one pixel wide). */
function paint(group: THREE.Group, x1: number, z1: number, x2: number, z2: number, mat: THREE.Material) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.004, 0.12), mat);
  m.position.set((x1 + x2) / 2, 0.006, (z1 + z2) / 2);
  m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  group.add(m);
}

function buildMarkings() {
  const group = new THREE.Group();
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  paint(group, -34, 0, 34, 0, white); // goal line
  paint(group, -20.16, 0, -20.16, 16.5, white);
  paint(group, 20.16, 0, 20.16, 16.5, white);
  paint(group, -20.16, 16.5, 20.16, 16.5, white);
  paint(group, -9.16, 0, -9.16, 5.5, white);
  paint(group, 9.16, 0, 9.16, 5.5, white);
  paint(group, -9.16, 5.5, 9.16, 5.5, white);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), white);
  spot.rotation.x = -Math.PI / 2;
  spot.position.set(0, 0.007, 10.97);
  group.add(spot);
  const arc: [number, number][] = [];
  for (let a = -60; a <= 60; a += 4) {
    const r = (a * Math.PI) / 180;
    arc.push([Math.sin(r) * 9.15, 10.97 + Math.cos(r) * 9.15]);
  }
  for (let i = 0; i < arc.length - 1; i++) paint(group, arc[i][0], arc[i][1], arc[i + 1][0], arc[i + 1][1], white);
  return group;
}

function buildGoal() {
  const group = new THREE.Group();
  const post = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const W = 3.66;
  const H = 2.44;
  for (const x of [-W, W]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H, 14), post);
    p.position.set(x, H / 2, 0);
    p.castShadow = true;
    group.add(p);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, W * 2, 14), post);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, H, 0);
  bar.castShadow = true;
  group.add(bar);

  // the net: a fine grid on the back, the roof and the two sides
  const D = 2.0;
  const pts: number[] = [];
  const seg = (a: number[], b: number[]) => pts.push(...a, ...b);
  for (let x = -W; x <= W + 0.01; x += W / 8) seg([x, 0, -D], [x, H, -D]);
  for (let y = 0; y <= H + 0.01; y += H / 7) seg([-W, y, -D], [W, y, -D]);
  for (let x = -W; x <= W + 0.01; x += W / 8) seg([x, H, 0], [x, H, -D]);
  for (let z = 0; z >= -D - 0.01; z -= D / 5) seg([-W, H, z], [W, H, z]);
  for (const x of [-W, W]) {
    for (let y = 0; y <= H + 0.01; y += H / 7) seg([x, y, 0], [x, y, -D]);
    for (let z = 0; z >= -D - 0.01; z -= D / 5) seg([x, 0, z], [x, H, z]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  group.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })));
  return group;
}

function ballTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4f4f4";
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#1a1a1a";
  for (let i = 0; i < 12; i++) {
    const x = (i % 6) * 43 + (i < 6 ? 20 : 42);
    const y = i < 6 ? 38 : 92;
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13);
    }
    g.closePath();
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

export function createKickScene(canvas: HTMLCanvasElement) {
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 75, 200);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);

  // lighting: bright floodlights from above, a faint cool fill and a warm rim from the back
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a2a20, 0.85));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.6);
  key.position.set(16, 34, 30);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 5, far: 90 });
  key.target.position.set(1, 0, 9);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xffb0a8, 0.9);
  rim.position.set(-20, 12, -12);
  scene.add(rim);

  const backdrop = buildBackdrop(renderer.capabilities.getMaxAnisotropy());
  scene.add(backdrop.group, buildMarkings(), buildGoal());

  const figure = createFigure();
  scene.add(figure.root);

  const ballTex = ballTexture();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 24, 18), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.45 }));
  ball.castShadow = true;
  scene.add(ball);

  // the ball's trail: a red line that grows as the ball moves
  const TRAIL_MAX = 160;
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: RED }));
  trail.frustumCulled = false;
  scene.add(trail);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.5;
  controls.maxDistance = 45;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;

  let kick: Kick | null = null;
  const contact = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const target = new THREE.Vector3();

  /** The starting camera: beside and behind the striker, looking towards the goal and the stand behind it. */
  function setView() {
    const cx = kick?.model.contactX ?? 1;
    const cz = kick?.model.contactZ ?? 11;
    camera.position.set(cx + 5.2, 2.2, cz + 5.4);
    controls.target.set(cx - 0.6, 1.7, cz - 3);
    controls.update();
  }

  /** Switches goal: finds where the player must stand so the striking boot meets the ball at the contact spot. */
  function setKick(k: Kick) {
    kick = k;
    figure.root.position.set(0, 0, 0);
    figure.apply(jointsAt(T_CONTACT));
    figure.root.updateMatrixWorld(true);
    const p = new THREE.Vector3();
    figure.strike.getWorldPosition(p);
    figure.root.position.set(k.model.contactX - p.x, 0, k.model.contactZ - p.z);
    contact.set(k.model.contactX, p.y, k.model.contactZ);
    cross.set(...k.model.crossFrom);
    target.set(...k.model.target);
    setView();
  }

  /** The ball at time t: a lob in to the striker, a fast shot into the top corner, then it settles in the net. */
  function ballAt(t: number): THREE.Vector3 {
    if (t <= T_CONTACT) {
      const s = t / T_CONTACT;
      const p = cross.clone().lerp(contact, s);
      p.y += 3.2 * 4 * s * (1 - s);
      return p;
    }
    if (t <= T_GOAL) {
      const s = (t - T_CONTACT) / (T_GOAL - T_CONTACT);
      const p = contact.clone().lerp(target, s);
      p.y += 0.25 * 4 * s * (1 - s);
      return p;
    }
    const s = Math.min(1, (t - T_GOAL) / 0.16);
    const p = target.clone();
    p.z -= 0.9 * s;
    p.y = Math.max(BALL_R, target.y - (target.y - BALL_R) * s * s);
    return p;
  }

  function setTime(t: number) {
    figure.apply(jointsAt(t));
    ball.position.copy(ballAt(t));
    ball.rotation.x = t * 14;
    const arr = trailGeo.getAttribute("position") as THREE.BufferAttribute;
    const n = Math.max(2, Math.min(TRAIL_MAX, Math.round(t * TRAIL_MAX)));
    for (let i = 0; i < n; i++) {
      const q = ballAt((t * i) / (n - 1));
      arr.setXYZ(i, q.x, q.y, q.z);
    }
    arr.needsUpdate = true;
    trailGeo.setDrawRange(0, t < 0.01 ? 0 : n);
    render();
  }

  /** Draws one frame. (The camera controls are advanced separately in tick(), which asks for a redraw when the view moves.) */
  function render() {
    renderer.render(scene, camera);
  }
  controls.addEventListener("change", render);

  function resize(w: number, h: number, dpr: number) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 60 : 40;
    camera.updateProjectionMatrix();
    render();
  }

  /** Called every animation frame: lets the camera controls glide to a stop. */
  function tick() {
    controls.update();
  }

  function dispose() {
    controls.dispose();
    figure.dispose();
    backdrop.dispose();
    ballTex.dispose();
    renderer.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }

  return { setKick, setTime, resize, render, tick, resetView: () => { setView(); render(); }, dispose };
}
