import * as THREE from "three";

import { edgePoint, rrLength } from "./geometry";
import { makeRng } from "./random";

/**
 * Old Trafford at night, in 3D. The bowl is built by "lofting": we walk round the edge of a rounded
 * rectangle and at each step draw the profile of the stand (how high it is at each distance from the pitch).
 * Everything is drawn with flat, unlit colours, with white ink lines on the edges for the comic look.
 *
 * Measurements are in world units (about 0.9 m). The pitch is 120 x 78; the bowl starts 10 units beyond it.
 */

export const PITCH_W = 120;
export const PITCH_H = 78;
const BW = 70;
const BH = 49;
const BR = 16;
const N = 480; // how many steps round the bowl
const PERIMETER = rrLength(BW, BH, BR);

/** The tunnel mouth, where the flight lands (south side, middle). */
export const TUNNEL = { x: 0, z: BH + 1.5 };

/** The height of the seating at a given distance from the bowl's edge (used to keep the camera clear and to seat the crowd). */
export function standHeight(d: number): number {
  if (d <= 0) return 0;
  if (d <= 22) return (9 * d) / 22;
  if (d <= 26) return 9 + (1.2 * (d - 22)) / 4;
  if (d <= 52) return 17 + (19 * (d - 26)) / 26;
  return 36;
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/** One column of the loft: where it sits on the bowl's edge and which way is "outwards". */
const columns = Array.from({ length: N }, (_, i) => edgePoint(BW, BH, BR, (i * PERIMETER) / N));

function loft(rows: { from: [number, number]; to: [number, number]; color: THREE.Color }[], sectorShade = 0.28) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const tmp = new THREE.Color();
  for (const row of rows) {
    const base = positions.length / 3;
    for (let side = 0; side < 2; side++) {
      const [d, h] = side === 0 ? row.from : row.to;
      for (let i = 0; i < N; i++) {
        const c = columns[i];
        positions.push(c.x + c.nx * d, h, c.y + c.ny * d);
        // sections of the crowd and the lights are brighter or darker, in blocks of 10 columns
        const shade = 1 - sectorShade + sectorShade * hash(Math.floor(i / 10) + row.color.r * 31.7);
        tmp.copy(row.color).multiplyScalar(shade);
        colors.push(tmp.r, tmp.g, tmp.b);
      }
    }
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      const a = base + i;
      const b = base + j;
      const c = base + N + i;
      const d2 = base + N + j;
      indices.push(a, b, c, b, d2, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  return g;
}

function ringLine(d: number, h: number, color: number, opacity: number) {
  const pts: number[] = [];
  for (let i = 0; i < N; i++) pts.push(columns[i].x + columns[i].nx * d, h, columns[i].y + columns[i].ny * d);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

/** Straight lines across a stand (stairways) or the roof (panel seams), evenly spaced round the bowl. */
function spokes(count: number, from: [number, number], to: [number, number], color: number, opacity: number) {
  const pts: number[] = [];
  for (let k = 0; k < count; k++) {
    const c = columns[Math.floor(((k + 0.5) * N) / count) % N];
    pts.push(c.x + c.nx * from[0], from[1], c.y + c.ny * from[0], c.x + c.nx * to[0], to[1], c.y + c.ny * to[0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function glowTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const SURROUND = 10; // the turf that continues beyond the touchlines, up to the stands
const TURF_W = PITCH_W + 2 * SURROUND;
const TURF_H = PITCH_H + 2 * SURROUND;

function pitchTexture(maxAniso: number) {
  const W = 2048;
  const H = Math.round((W * TURF_H) / TURF_W);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const k = W / TURF_W; // pixels per unit
  const stripes = TURF_W / 10;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? "#363636" : "#1c1c1c";
    ctx.fillRect((i * W) / stripes, 0, W / stripes + 1, H);
  }
  // white markings (real proportions: 1 metre is 1.143 units)
  const m = PITCH_W / 105;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 0.36 * k;
  ctx.lineCap = "square";
  const X = (x: number) => (x + TURF_W / 2) * k;
  const Y = (z: number) => (z + TURF_H / 2) * k;
  ctx.strokeRect(X(-PITCH_W / 2), Y(-PITCH_H / 2), PITCH_W * k, PITCH_H * k);
  ctx.beginPath();
  ctx.moveTo(X(0), Y(-PITCH_H / 2));
  ctx.lineTo(X(0), Y(PITCH_H / 2));
  ctx.stroke();
  const r = 9.15 * m;
  ctx.beginPath();
  ctx.arc(X(0), Y(0), r * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(X(0), Y(0), 0.6 * k, 0, Math.PI * 2);
  ctx.fill();
  for (const s of [-1, 1]) {
    const gl = s * (PITCH_W / 2);
    const box = 16.5 * m;
    const six = 5.5 * m;
    const boxH = 20.16 * m;
    const sixH = 9.16 * m;
    ctx.strokeRect(Math.min(X(gl), X(gl - s * box)), Y(-boxH), Math.abs(box * k), 2 * boxH * k);
    ctx.strokeRect(Math.min(X(gl), X(gl - s * six)), Y(-sixH), Math.abs(six * k), 2 * sixH * k);
    const spot = gl - s * 11 * m;
    ctx.beginPath();
    ctx.arc(X(spot), Y(0), 0.6 * k, 0, Math.PI * 2);
    ctx.fill();
    // the penalty arc, only the part outside the box
    const dx = Math.abs(spot - (gl - s * box));
    const a = Math.acos(dx / r);
    ctx.beginPath();
    if (s === -1) ctx.arc(X(spot), Y(0), r * k, -a, a);
    else ctx.arc(X(spot), Y(0), r * k, Math.PI - a, Math.PI + a);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = maxAniso;
  return tex;
}

export function buildStadium(maxAniso: number) {
  const group = new THREE.Group();
  const red = new THREE.Color("#DA291C");
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });

  // ---- the bowl: apron, lower tier, walkway, riser, upper tier, outer wall, roof ----
  const rows: { from: [number, number]; to: [number, number]; color: THREE.Color }[] = [];
  const dark = (hex: string) => new THREE.Color(hex);
  rows.push({ from: [-10, 0], to: [0, 0], color: dark("#0a0a0a") });
  const lowerRows = 12;
  for (let k = 0; k < lowerRows; k++) {
    const d0 = (22 * k) / lowerRows;
    const d1 = (22 * (k + 1)) / lowerRows;
    rows.push({ from: [d0, standHeight(d0)], to: [d1, standHeight(d1)], color: red.clone().multiplyScalar(k % 2 ? 0.95 : 0.72) });
  }
  rows.push({ from: [22, 9], to: [26, 10.2], color: dark("#1a1a1a") });
  rows.push({ from: [26, 10.2], to: [26, 17], color: dark("#101010") });
  const upperRows = 14;
  for (let k = 0; k < upperRows; k++) {
    const d0 = 26 + (26 * k) / upperRows;
    const d1 = 26 + (26 * (k + 1)) / upperRows;
    rows.push({ from: [d0, standHeight(d0)], to: [d1, standHeight(d1)], color: red.clone().multiplyScalar(k % 2 ? 1.05 : 0.8) });
  }
  rows.push({ from: [62, 0], to: [62, 41.4], color: dark("#3c3c3c") }); // the outer wall, lit from below
  rows.push({ from: [62, 41.4], to: [62, 44.5], color: dark("#f4f4f4") }); // a bright rim round the roof
  const bowl = new THREE.Mesh(loft(rows), mat);
  group.add(bowl);

  // ---- the roof: top and underside ----
  const roofTop = new THREE.Mesh(loft([{ from: [34, 38.7], to: [62, 41.4], color: dark("#2e2e2e") }], 0.35), mat);
  const roofUnder = new THREE.Mesh(loft([{ from: [34, 38.2], to: [62, 40.9], color: dark("#262626") }], 0.2), mat);
  group.add(roofTop, roofUnder);

  // ---- white ink lines along the edges ----
  const ink = 0xe9e9e9;
  const rings: [number, number, number][] = [
    [0, 0, 0.55], [22, 9, 0.5], [26, 10.2, 0.45], [26, 17, 0.45], [52, 36, 0.5],
    [34, 38.7, 0.9], [62, 41.4, 1], [62, 44.5, 1], [62, 0, 0.8], [-10, 0, 0.3],
  ];
  for (const [d, h, o] of rings) group.add(ringLine(d, h, ink, o));
  for (const h of [8, 16, 24, 32]) group.add(ringLine(62, h, 0xb8b8b8, 0.3)); // rows of lit windows on the outer wall
  group.add(spokes(46, [0, 0], [22, 9], 0x000000, 0.7), spokes(46, [26, 17], [52, 36], 0x000000, 0.7));
  group.add(spokes(96, [34, 38.7], [62, 41.4], 0x555555, 0.8), spokes(120, [62, 0], [62, 41.4], 0x9a9aa0, 0.7));

  // ---- the crowd: thousands of tiny dots on the seats ----
  const rng = makeRng(2026);
  const count = 11000;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const upper = rng() < 0.55;
    const d = upper ? 26.6 + rng() * 25 : 0.6 + rng() * 21;
    const e = edgePoint(BW, BH, BR, rng() * PERIMETER);
    if (Math.abs(e.x) < 6 && e.y > 0 && d < 24) continue; // keep the tunnel clear
    pos[i * 3] = e.x + e.nx * d;
    pos[i * 3 + 1] = standHeight(d) + 0.5;
    pos[i * 3 + 2] = e.y + e.ny * d;
    const roll = rng();
    if (roll < 0.62) c.set("#DA291C").multiplyScalar(0.7 + rng() * 0.5);
    else if (roll < 0.86) c.set("#ffffff").multiplyScalar(0.55 + rng() * 0.45);
    else if (roll < 0.95) c.set("#222222");
    else c.set("#FBE122").multiplyScalar(0.8);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  const crowdGeo = new THREE.BufferGeometry();
  crowdGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  crowdGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  group.add(new THREE.Points(crowdGeo, new THREE.PointsMaterial({ size: 1.25, sizeAttenuation: true, vertexColors: true })));

  // ---- the pitch, goals and ball ----
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(TURF_W, TURF_H),
    new THREE.MeshBasicMaterial({ map: pitchTexture(maxAniso) }),
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0.06;
  group.add(pitch);

  const goalPts: number[] = [];
  const gw = (7.32 * PITCH_W) / 105 / 2;
  const gh = (2.44 * PITCH_W) / 105;
  for (const s of [-1, 1]) {
    const x0 = s * (PITCH_W / 2);
    const x1 = s * (PITCH_W / 2 + 2.4);
    goalPts.push(x0, 0, -gw, x0, gh, -gw, x0, gh, -gw, x0, gh, gw, x0, gh, gw, x0, 0, gw);
    goalPts.push(x0, gh, -gw, x1, gh * 0.6, -gw, x0, gh, gw, x1, gh * 0.6, gw, x1, gh * 0.6, -gw, x1, gh * 0.6, gw, x1, 0, -gw, x1, gh * 0.6, -gw, x1, 0, gw, x1, gh * 0.6, gw);
  }
  const goalGeo = new THREE.BufferGeometry();
  goalGeo.setAttribute("position", new THREE.Float32BufferAttribute(goalPts, 3));
  group.add(new THREE.LineSegments(goalGeo, new THREE.LineBasicMaterial({ color: 0xffffff })));

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  ball.position.set(0, 0.6, 0);
  group.add(ball);

  // ---- the tunnel: a dark opening in the lower tier ----
  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(11, 4.4, 14), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  tunnel.position.set(0, 1.6, BH + 7.2);
  group.add(tunnel);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(11.2, 4.5, 0.4)), new THREE.LineBasicMaterial({ color: 0xffffff }));
  frame.position.set(0, 2.25, BH + 0.4);
  group.add(frame);
  for (const sx of [-1, 1]) {
    const dugout = new THREE.Mesh(new THREE.BoxGeometry(14, 1.3, 3.6), new THREE.MeshBasicMaterial({ color: 0xda291c }));
    dugout.position.set(sx * 15, 0.7, PITCH_H / 2 + 3.4);
    group.add(dugout);
    const dugoutEdges = new THREE.LineSegments(new THREE.EdgesGeometry(dugout.geometry), new THREE.LineBasicMaterial({ color: 0xffffff }));
    dugoutEdges.position.copy(dugout.position);
    group.add(dugoutEdges);
  }

  // ---- floodlights and glow ----
  const flare = glowTexture("rgba(255,255,255,1)", "rgba(255,120,100,0.55)");
  const lights: THREE.Sprite[] = [];
  for (let i = 0; i < 44; i++) {
    const col2 = columns[Math.floor((i * N) / 44) % N];
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: flare, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    sprite.position.set(col2.x + col2.nx * 60, 43.5, col2.y + col2.ny * 60);
    sprite.scale.setScalar(i % 2 ? 22 : 16);
    lights.push(sprite);
    group.add(sprite);
  }
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture("rgba(255,70,50,0.38)", "rgba(218,41,28,0.16)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }),
  );
  halo.position.set(0, 30, 0);
  halo.scale.setScalar(1000);
  group.add(halo);

  return { group, ball, halo };
}
