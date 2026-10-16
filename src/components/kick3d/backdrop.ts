import * as THREE from "three";

import { makeRng } from "../intro3d/random";

/**
 * The stadium around the goal: striped turf, a packed stand behind the goal, stands along the sides,
 * advertising boards and floodlight glows. Everything is drawn from simple shapes and one painted texture
 * (a crowd in red, white and black), in the site's own colours.
 * The goal line is z = 0 and the pitch runs along +z; x is sideways (metres).
 */

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, aniso: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}

/** Light and dark mowing stripes. */
function turfTexture(aniso: number) {
  return canvasTexture(
    64,
    128,
    (g) => {
      g.fillStyle = "#1c3a27";
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "#244632";
      g.fillRect(0, 64, 64, 64);
      const rng = makeRng(5);
      for (let i = 0; i < 500; i++) {
        g.fillStyle = `rgba(255,255,255,${0.012 + rng() * 0.02})`;
        g.fillRect(rng() * 64, rng() * 128, 1, 2);
      }
    },
    aniso,
  );
}

/** A tile of stand: rows of seats, mostly red, with fans in red, white and black. */
function crowdTexture(aniso: number) {
  return canvasTexture(
    512,
    512,
    (g) => {
      const rng = makeRng(11);
      g.fillStyle = "#2a0b09";
      g.fillRect(0, 0, 512, 512);
      const shirts = ["#da291c", "#da291c", "#da291c", "#b5231a", "#f2f2f2", "#f2f2f2", "#171717", "#171717", "#7d7d7d"];
      const heads = ["#e8e8e8", "#cfcfcf", "#9a9a9a", "#2a2a2a"];
      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
          const x = col * 32;
          const y = row * 32;
          g.fillStyle = "#6e1812"; // the seat
          g.fillRect(x + 3, y + 14, 26, 16);
          if (rng() < 0.93) {
            g.fillStyle = shirts[Math.floor(rng() * shirts.length)];
            g.beginPath();
            g.roundRect(x + 6, y + 14, 20, 17, 5);
            g.fill();
            g.fillStyle = heads[Math.floor(rng() * heads.length)];
            g.beginPath();
            g.arc(x + 16, y + 9, 5.5, 0, Math.PI * 2);
            g.fill();
          }
          g.fillStyle = "rgba(0,0,0,0.35)"; // shadow line under each row
          g.fillRect(x, y + 30, 32, 2);
        }
      }
    },
    aniso,
  );
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, "rgba(255,244,225,0.65)");
  grad.addColorStop(1, "rgba(255,244,225,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function buildBackdrop(maxAniso: number) {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  // turf
  const turf = track(turfTexture(maxAniso));
  turf.repeat.set(1, 24);
  const grass = new THREE.Mesh(track(new THREE.PlaneGeometry(220, 220)), track(new THREE.MeshStandardMaterial({ map: turf, roughness: 1 })));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, 0, 70);
  grass.receiveShadow = true;
  group.add(grass);

  // stands: an inclined plane of crowd, a dark underside, and a roof slab
  const crowd = track(crowdTexture(maxAniso));
  const seats = track(new THREE.MeshStandardMaterial({ map: crowd, emissiveMap: crowd, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 1, side: THREE.DoubleSide }));
  const concrete = track(new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 1, side: THREE.DoubleSide }));
  const roofMat = track(new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.9, side: THREE.DoubleSide }));

  /** An inclined bank of seats between two points on the ground plan (a to b), rising from y0 to y1. */
  function bank(a: [number, number], b: [number, number], y0: number, y1: number, length: number, tiles = 16) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const run = Math.hypot(dx, dz);
    const rise = y1 - y0;
    const slope = Math.hypot(run, rise);
    const geo = track(new THREE.PlaneGeometry(length, slope));
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (length / tiles), uv.getY(i) * (slope / tiles));
    const m = new THREE.Mesh(geo, seats.clone());
    const mat = m.material as THREE.MeshStandardMaterial;
    track(mat);
    mat.map = crowd.clone();
    mat.map.needsUpdate = true;
    mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
    mat.emissiveMap = mat.map;
    track(mat.map);
    // the plane is built flat (x along its length, y up its slope); turn it to lie on the slope and face the pitch
    const yaw = Math.atan2(dx, dz); // direction of travel across the ground
    const pitch = Math.atan2(rise, run);
    m.rotation.order = "YXZ";
    m.rotation.set(-(Math.PI / 2 - pitch), yaw + Math.PI, 0);
    m.position.set((a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2);
    group.add(m);
    return m;
  }

  // behind the goal (z < 0): two tiers and a roof
  bank([0, -7], [0, -26], 0.8, 11, 110);
  bank([0, -29], [0, -46], 13.5, 25, 120);
  const mid = new THREE.Mesh(track(new THREE.BoxGeometry(120, 2.2, 4)), concrete);
  mid.position.set(0, 12.2, -27.5);
  group.add(mid);
  const roof = new THREE.Mesh(track(new THREE.BoxGeometry(130, 0.8, 34)), roofMat);
  roof.position.set(0, 27.5, -34);
  roof.rotation.x = 0.05;
  group.add(roof);
  const back = new THREE.Mesh(track(new THREE.BoxGeometry(130, 30, 1)), concrete);
  back.position.set(0, 14, -47);
  group.add(back);

  // along the sides (x = +/-): lower stands facing the pitch
  for (const s of [-1, 1]) {
    bank([s * 40, 8], [s * 58, 8], 0.8, 14, 100, 16).position.z = 52;
    const wall = new THREE.Mesh(track(new THREE.BoxGeometry(1, 20, 120)), concrete);
    wall.position.set(s * 60, 10, 50);
    group.add(wall);
  }

  // advertising boards: black with a thin red top line, around the goal end and along the touchlines
  const board = track(new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.6 }));
  const stripe = track(new THREE.MeshBasicMaterial({ color: 0xda291c }));
  function boards(x: number, z: number, w: number, d: number) {
    const b = new THREE.Mesh(track(new THREE.BoxGeometry(w, 0.9, d)), board);
    b.position.set(x, 0.45, z);
    const t = new THREE.Mesh(track(new THREE.BoxGeometry(w, 0.06, d + 0.02)), stripe);
    t.position.set(x, 0.92, z);
    group.add(b, t);
  }
  boards(0, -6.2, 80, 0.3);
  boards(-36, 40, 0.3, 90);
  boards(36, 40, 0.3, 90);

  // floodlights: glowing flares high up behind and beside the stand
  const glowTex = track(glowTexture());
  const glowMat = track(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  for (const [x, y, z, size] of [
    [-48, 30, -30, 38],
    [48, 30, -30, 38],
    [-62, 34, 48, 44],
    [62, 34, 48, 44],
  ] as [number, number, number, number][]) {
    const sp = new THREE.Sprite(glowMat);
    sp.position.set(x, y, z);
    sp.scale.set(size, size, 1);
    group.add(sp);
  }

  return {
    group,
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
