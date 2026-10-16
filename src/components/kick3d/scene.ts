import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type { Kick } from "@/lib/kicks";
import { createFigure } from "./figure";
import { jointsAt, T_CONTACT, T_GOAL } from "./motion";

/**
 * The 3D reconstruction of one goal: a stretch of pitch with the goal, a stylised player, the ball and a marker
 * showing how far from the goal line the ball was struck. You can drag to turn the view, and scroll or pinch to zoom.
 * Positions: the goal line is z = 0 and the pitch runs along +z; x is sideways; y is up (metres).
 */

export type LabelPlacement = { x: number; y: number; visible: boolean };

const RED = 0xda291c;
const GOLD = 0xfbe122;
const BALL_R = 0.11;

function lineMat(color: number, opacity = 1) {
  return new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
}

/** A flat white line painted on the grass, as a thin box (WebGL lines are always one pixel wide). */
function paint(group: THREE.Group, x1: number, z1: number, x2: number, z2: number, mat: THREE.Material) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.004, 0.12), mat);
  m.position.set((x1 + x2) / 2, 0.003, (z1 + z2) / 2);
  m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  group.add(m);
}

function buildPitch() {
  const group = new THREE.Group();
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ color: 0x14231a, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  group.add(grass);

  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  paint(group, -34, 0, 34, 0, white); // goal line
  const pa = [20.16, 16.5];
  paint(group, -pa[0], 0, -pa[0], pa[1], white);
  paint(group, pa[0], 0, pa[0], pa[1], white);
  paint(group, -pa[0], pa[1], pa[0], pa[1], white);
  paint(group, -9.16, 0, -9.16, 5.5, white);
  paint(group, 9.16, 0, 9.16, 5.5, white);
  paint(group, -9.16, 5.5, 9.16, 5.5, white);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), white);
  spot.rotation.x = -Math.PI / 2;
  spot.position.set(0, 0.004, 10.97);
  group.add(spot);
  // the penalty arc: the part of a 9.15 m circle around the spot that lies outside the box
  const arcPts: [number, number][] = [];
  for (let a = -60; a <= 60; a += 4) {
    const r = (a * Math.PI) / 180;
    arcPts.push([Math.sin(r) * 9.15, 10.97 + Math.cos(r) * 9.15]);
  }
  for (let i = 0; i < arcPts.length - 1; i++) paint(group, arcPts[i][0], arcPts[i][1], arcPts[i + 1][0], arcPts[i + 1][1], white);
  return group;
}

function buildGoal() {
  const group = new THREE.Group();
  const post = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const W = 3.66;
  const H = 2.44;
  for (const x of [-W, W]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H, 10), post);
    p.position.set(x, H / 2, 0);
    group.add(p);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, W * 2, 10), post);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, H, 0);
  group.add(bar);

  // net: a faint grid on the back, the roof and the two sides
  const D = 2.0;
  const pts: number[] = [];
  const seg = (a: number[], b: number[]) => pts.push(...a, ...b);
  for (let x = -W; x <= W + 0.01; x += W / 6) seg([x, 0, -D], [x, H, -D]);
  for (let y = 0; y <= H + 0.01; y += H / 5) seg([-W, y, -D], [W, y, -D]);
  for (let x = -W; x <= W + 0.01; x += W / 6) seg([x, H, 0], [x, H, -D]);
  for (const x of [-W, W]) {
    for (let y = 0; y <= H + 0.01; y += H / 5) seg([x, y, 0], [x, y, -D]);
    for (let z = 0; z >= -D - 0.01; z -= D / 4) seg([x, 0, z], [x, H, z]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  group.add(new THREE.LineSegments(g, lineMat(0xffffff, 0.35)));
  return group;
}

export function createKickScene(canvas: HTMLCanvasElement, onLabel: (p: LabelPlacement) => void) {
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 40, 110);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x101410, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(18, 30, 26);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9a90, 0.9);
  rim.position.set(-20, 10, -10);
  scene.add(rim);

  scene.add(buildPitch(), buildGoal());

  const figure = createFigure();
  scene.add(figure.root);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 20, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  scene.add(ball);

  // the ball's trail: a red line that grows as the ball moves
  const TRAIL_MAX = 160;
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: RED }));
  trail.frustumCulled = false;
  scene.add(trail);

  // the distance marker: a gold dashed line along the grass from the goal line to the spot under the strike
  const marker = new THREE.Group();
  scene.add(marker);
  const markerLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: GOLD, dashSize: 0.5, gapSize: 0.3 }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 32), new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  const drop = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.45 }));
  marker.add(markerLine, ring, drop);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3;
  controls.maxDistance = 55;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;

  let kick: Kick | null = null;
  let contact = new THREE.Vector3();
  let cross = new THREE.Vector3();
  let target = new THREE.Vector3();
  let labelAt = new THREE.Vector3();

  function setView() {
    camera.position.set(15, 3.6, 22);
    controls.target.set(1, 1.4, 6.5);
    controls.update();
  }

  /** Switches to another goal: finds where the player must stand so the striking foot meets the ball at the contact spot. */
  function setKick(k: Kick) {
    kick = k;
    // where does the striking foot end up at contact, if the player stands at the origin?
    figure.root.position.set(0, 0, 0);
    figure.apply(jointsAt(T_CONTACT));
    figure.root.updateMatrixWorld(true);
    const foot = new THREE.Vector3();
    figure.foot.getWorldPosition(foot);
    foot.y += 0.12; // the ball is struck just above the sole of the boot
    const stand = new THREE.Vector3(k.model.contactX - foot.x, 0, k.model.contactZ - foot.z);
    figure.root.position.copy(stand);
    contact.set(k.model.contactX, foot.y, k.model.contactZ);
    cross.set(...k.model.crossFrom);
    target.set(...k.model.target);

    // distance marker
    const d = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(k.model.contactX, 0.03, k.model.contactZ), new THREE.Vector3(k.model.contactX, 0.03, 0)]);
    markerLine.geometry.dispose();
    markerLine.geometry = d;
    markerLine.computeLineDistances();
    ring.position.set(k.model.contactX, 0.01, k.model.contactZ);
    const v = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(k.model.contactX, 0.03, k.model.contactZ), contact]);
    drop.geometry.dispose();
    drop.geometry = v;
    labelAt.set(k.model.contactX, 0.2, k.model.contactZ / 2);

    setView();
    setTime(0);
  }

  /** The ball's position at time t (a lob in to the striker, then a fast shot into the goal, then it settles in the net). */
  function ballAt(t: number): THREE.Vector3 {
    if (t <= T_CONTACT) {
      const s = t / T_CONTACT;
      const p = cross.clone().lerp(contact, s);
      p.y += 4.2 * 4 * s * (1 - s); // the arc of the cross
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
    p.z -= 0.9 * s; // the net holds it
    p.y = Math.max(BALL_R, target.y - (target.y - BALL_R) * s * s);
    return p;
  }

  function setTime(t: number) {
    figure.apply(jointsAt(t));
    const p = ballAt(t);
    ball.position.copy(p);
    // the trail covers the path from the start of the cross to the ball's current position
    const arr = trailGeo.getAttribute("position") as THREE.BufferAttribute;
    const n = Math.max(2, Math.min(TRAIL_MAX, Math.round((t / 1) * TRAIL_MAX)));
    for (let i = 0; i < n; i++) {
      const q = ballAt((t * i) / (n - 1));
      arr.setXYZ(i, q.x, q.y, q.z);
    }
    arr.needsUpdate = true;
    trailGeo.setDrawRange(0, t < 0.01 ? 0 : n);
    render();
  }

  function render() {
    controls.update();
    renderer.render(scene, camera);
    const v = labelAt.clone().project(camera);
    onLabel({ x: (v.x * 0.5 + 0.5) * canvas.clientWidth, y: (-v.y * 0.5 + 0.5) * canvas.clientHeight, visible: v.z < 1 });
  }

  controls.addEventListener("change", render);

  function resize(w: number, h: number, dpr: number) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 62 : 42;
    camera.updateProjectionMatrix();
    render();
  }

  function dispose() {
    controls.dispose();
    figure.dispose();
    renderer.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }

  return { setKick, setTime, resize, render, resetView: () => { setView(); render(); }, dispose, controls, current: () => kick };
}
