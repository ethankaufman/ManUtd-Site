import * as THREE from "three";

import { FLIGHT } from "./layout";
import { clamp, ramp } from "./random";

/**
 * The camera's flight, worked out from how far you have scrolled (p, from 0 to 1).
 *
 *   0.00 - 0.20   a long, level run low over the city
 *   0.20 - 0.78   a banked, sideways sweep that becomes a spiral round the stadium, tightening and dropping
 *   0.78 - 1.00   a dive over the south stand, levelling out to land at the tunnel mouth facing the pitch
 *
 * The route is a smooth curve through the points in layout.ts. The camera tilts (rolls) into the turns
 * the way a flyer would, and looks ahead on the run, at the stadium during the spiral, and across the pitch at the end.
 */

const curve = new THREE.CatmullRomCurve3(FLIGHT.all.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, "centripetal");
curve.arcLengthDivisions = 4000;
const lengths = curve.getLengths(4000);
const total = lengths[lengths.length - 1];
const fractionAtWaypoint = (i: number) => lengths[Math.round((i / (FLIGHT.all.length - 1)) * 4000)] / total;

const U_RUN = fractionAtWaypoint(FLIGHT.run.length - 1);
const U_ORBIT = fractionAtWaypoint(FLIGHT.run.length + FLIGHT.orbit.length - 1);
const P_RUN = 0.2;
const P_ORBIT = 0.78;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** How far along the route (0 to 1) the camera is for a given scroll position. */
function routeFraction(p: number): number {
  if (p < P_RUN) return lerp(0, U_RUN, p / P_RUN);
  if (p < P_ORBIT) return lerp(U_RUN, U_ORBIT, (p - P_RUN) / (P_ORBIT - P_RUN));
  const s = (p - P_ORBIT) / (1 - P_ORBIT);
  return lerp(U_ORBIT, 1, 1 - Math.pow(1 - s, 2.2)); // slows down gently as it lands
}

const CENTER = new THREE.Vector3(0, 8, 0);
const ACROSS_THE_PITCH = new THREE.Vector3(0, 5.5, -90);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export type Pose = { position: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3; fov: number; sweep: number };

export function pose(p: number): Pose {
  const u = clamp(routeFraction(clamp(p)), 0, 1);
  const position = curve.getPointAt(u);
  const tangent = curve.getTangentAt(u);

  // where to look: ahead, then at the stadium, then across the pitch
  const ahead = position.clone().addScaledVector(tangent, 300);
  ahead.y -= 22;
  const toStadium = ramp(u, U_RUN * 0.98, U_RUN + 0.2 * (U_ORBIT - U_RUN));
  const toPitch = ramp(u, U_ORBIT + 0.45 * (1 - U_ORBIT), 0.985);
  const target = ahead.clone().lerp(CENTER, toStadium).lerp(ACROSS_THE_PITCH, toPitch);

  // bank into the turns: the tighter the turn, the more the camera leans (left turns lean left)
  const d = 0.006;
  const t0 = curve.getTangentAt(clamp(u - d, 0, 1));
  const t1 = curve.getTangentAt(clamp(u + d, 0, 1));
  const arc = curve.getPointAt(clamp(u + d, 0, 1)).distanceTo(curve.getPointAt(clamp(u - d, 0, 1))) || 1;
  const turn = (t0.x * t1.z - t0.z * t1.x) / arc; // negative = turning left
  const roll = clamp(turn * 220, -0.42, 0.42) * (1 - ramp(u, 0.965, 0.995));

  const f = target.clone().sub(position).normalize();
  const right = new THREE.Vector3().crossVectors(f, WORLD_UP).normalize();
  const up0 = new THREE.Vector3().crossVectors(right, f);
  const up = up0.multiplyScalar(Math.cos(roll)).addScaledVector(right, Math.sin(roll)).normalize();

  const fov = lerp(lerp(66, 58, ramp(p, 0, 0.5)), 50, ramp(p, 0.8, 1));
  return { position, target, up, fov, sweep: Math.abs(roll) };
}
