import { distToPolyline } from "./geometry";
import { makeRng } from "./random";

/**
 * Where everything goes in the night-time scene. Plain data, no 3D library needed.
 *
 * Axes: x points east, y is up, z points south, and the middle of Old Trafford is (0, 0, 0).
 * One unit is about 0.9 metres. The streets are a stylised drawing, not a real map.
 */

export const CANAL: number[][] = [[-3400, -560], [-2000, -470], [-1000, -470], [-300, -740], [500, -820], [1200, -640], [2000, -720], [3400, -640]];
export const RAIL: number[][] = [[-1500, 1500], [-1300, 1300], [-550, 500], [-340, 150], [-320, -150], [-280, -520], [-100, -1000], [0, -1500], [100, -2400]];
export const ROADS: { width: number; pts: number[][] }[] = [
  { width: 24, pts: [[400, 1600], [320, 700], [300, 0], [320, -500], [420, -1000], [520, -1600]] }, // the long road past the east side
  { width: 14, pts: [[300, -40], [215, -40]] }, // feeder roads into the car parks
  { width: 14, pts: [[300, 60], [215, 60]] },
  { width: 14, pts: [[-60, 330], [-60, 1500]] },
  { width: 24, pts: [[-3000, 640], [-300, 560], [300, 560], [3000, 700]] },
];
export const INDUSTRIAL = { x0: -1450, x1: -650, z0: 60, z1: 440 };
export const PARKS = [
  { x: 560, z: 430, w: 200, d: 150 },
  { x: -640, z: -330, w: 220, d: 150 },
];
export const CAR_PARKS = [
  { x: 150, z: -95, w: 135, d: 205 }, // east
  { x: -120, z: -205, w: 240, d: 66 }, // north
  { x: -120, z: 140, w: 240, d: 66 }, // south
  { x: -285, z: -65, w: 135, d: 165 }, // west
];

/** A building: footprint, height, turn (radians) and a colour code (0 = dark brick, 1 = red roof). */
export type Building = { x: number; z: number; w: number; d: number; h: number; angle: number; tint: number };

const rot = (x: number, y: number, a: number): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/**
 * The camera's route, as a list of [x, y, z] points. First a long level run past the south side,
 * then a left-hand spiral round the stadium that tightens and drops, then a dive over the south stand
 * to the tunnel mouth. Built here (not in the 3D code) so buildings can keep out of the way.
 */
export const FLIGHT = (() => {
  const run: number[][] = [[-2700, 78, 840], [-1800, 80, 780], [-900, 82, 650]];
  const orbit: number[][] = [];
  // left turns (counter-clockwise seen from above): start due south of the stadium and sweep round almost
  // a full circle, ending south-west of it, while the radius shrinks and the camera drops
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const phi = (-90 + 340 * t) * (Math.PI / 180);
    const r = 560 - 290 * t;
    const y = 82 - 32 * t;
    orbit.push([r * Math.cos(phi), y, -r * Math.sin(phi)]);
  }
  // then a left curve to head north over the south stand, a dive into the bowl, and a level landing in front of the tunnel
  const dive: number[][] = [[-40, 51, 205], [0, 50, 150], [0, 48, 112], [0, 45, 84], [0, 30, 72], [0, 14, 60], [0, 5, 52], [0, 1.75, 46.5]];
  return { run, orbit, dive, all: [...run, ...orbit, ...dive] };
})();

const flightLine = FLIGHT.all.map((p) => [p[0], p[2]]);

function buildCity() {
  const rng = makeRng(1910);
  const houses: Building[] = [];
  const lattices = [
    { angle: (8 * Math.PI) / 180, keep: (x: number) => x > -300 },
    { angle: (-18 * Math.PI) / 180, keep: (x: number) => x < -360 },
  ];
  const cw = 112;
  const ch = 74;
  const R = 2500;
  for (const lat of lattices) {
    for (let i = -30; i <= 30; i++) {
      for (let j = -40; j <= 40; j++) {
        const [cx, cz] = rot(i * cw, j * ch, lat.angle);
        const dist = Math.hypot(cx, cz);
        if (dist > R || !lat.keep(cx)) continue;
        if ((Math.abs(cx) < 345 && Math.abs(cz) < 275) || dist < 430) continue; // the stadium and its car parks
        if (distToPolyline(cx, cz, CANAL) < 78 || distToPolyline(cx, cz, RAIL) < 34) continue;
        if (ROADS.some((r) => distToPolyline(cx, cz, r.pts) < r.width / 2 + 24)) continue;
        if (cx > INDUSTRIAL.x0 - 70 && cx < INDUSTRIAL.x1 + 70 && cz > INDUSTRIAL.z0 - 60 && cz < INDUSTRIAL.z1 + 60) continue;
        if (PARKS.some((p) => Math.abs(cx - p.x) < p.w / 2 + 55 && Math.abs(cz - p.z) < p.d / 2 + 45)) continue;
        if (rng() < 0.05) continue; // the odd empty plot
        houses.push({ x: cx, z: cz, w: 90 + rng() * 10, d: 54 + rng() * 8, h: 7 + rng() * 5, angle: -lat.angle, tint: rng() < 0.04 ? 1 : 0 });
      }
    }
  }
  return houses;
}

function buildWarehouses() {
  const rng = makeRng(77);
  const out: Building[] = [];
  for (let z = INDUSTRIAL.z0; z < INDUSTRIAL.z1 - 60; ) {
    const d = 50 + rng() * 38;
    for (let x = INDUSTRIAL.x0; x < INDUSTRIAL.x1 - 80; ) {
      const w = 90 + rng() * 80;
      out.push({ x: x + w / 2, z: z + d / 2, w, d, h: 12 + rng() * 10, angle: 0, tint: rng() < 0.16 ? 1 : 0 });
      x += w + 14 + rng() * 14;
    }
    z += d + 16 + rng() * 10;
  }
  return out;
}

function buildTowers(houses: Building[]) {
  const rng = makeRng(99);
  const out: Building[] = [];
  let tries = 0;
  while (out.length < 26 && tries++ < 600) {
    const a = rng() * Math.PI * 2;
    const r = 700 + rng() * 1700;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    if (distToPolyline(x, z, flightLine) < 260) continue; // keep clear of the camera's route
    if (distToPolyline(x, z, CANAL) < 120 || distToPolyline(x, z, RAIL) < 60) continue;
    if (ROADS.some((rd) => distToPolyline(x, z, rd.pts) < 60)) continue;
    if (houses.some((b) => Math.abs(b.x - x) < 60 && Math.abs(b.z - z) < 50)) continue;
    out.push({ x, z, w: 26 + rng() * 14, d: 26 + rng() * 14, h: 40 + rng() * 60, angle: rng() * 1.5, tint: 0 });
  }
  return out;
}

function buildTrees() {
  const rng = makeRng(42);
  const trees: { x: number; z: number; r: number; h: number }[] = [];
  for (const p of PARKS) {
    for (let n = 0; n < 34; n++) {
      trees.push({ x: p.x + (rng() - 0.5) * (p.w - 14), z: p.z + (rng() - 0.5) * (p.d - 14), r: 4.5 + rng() * 4, h: 7 + rng() * 6 });
    }
  }
  return trees;
}

function buildCars() {
  const rng = makeRng(5);
  const cars: { x: number; z: number; angle: number; shade: number }[] = [];
  for (const c of CAR_PARKS) {
    const horizontal = c.w > c.d; // long car parks have their cars in rows along the long side
    for (let a = 5; a < (horizontal ? c.w : c.d) - 5; a += 9) {
      for (let b = 6; b < (horizontal ? c.d : c.w) - 4; b += 6.4) {
        if (rng() < 0.2) continue;
        const x = c.x + (horizontal ? a : b);
        const z = c.z + (horizontal ? b : a);
        cars.push({ x, z, angle: horizontal ? 0 : Math.PI / 2, shade: rng() });
      }
    }
  }
  return cars;
}

export const HOUSES = buildCity();
export const WAREHOUSES = buildWarehouses();
export const TOWERS = buildTowers(HOUSES);
export const TREES = buildTrees();
export const CARS = buildCars();
