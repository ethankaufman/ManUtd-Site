import type { Joints } from "./figure";

/**
 * The movement of an overhead kick as a few key poses, blended smoothly between them.
 * Time t runs 0 to 1 over the whole clip. The ball is struck at T_CONTACT.
 * (A stylised reconstruction, not tracking data.)
 */

export const T_CONTACT = 0.46;
export const T_GOAL = 0.64; // when the ball reaches the goal

const STAND: Joints = { h: 0.95, tilt: 0, spine: 0, head: 0, armLx: 0.1, armLz: 0.15, armRx: 0.1, armRz: 0.15, hipL: 0, kneeL: 0.05, hipR: 0, kneeR: 0.05 };

const KEYS: { t: number; j: Joints }[] = [
  { t: 0.0, j: STAND },
  // ready: knees bent, arms back, looking up at the ball
  { t: 0.16, j: { h: 0.85, tilt: 0.05, spine: 0.1, head: -0.35, armLx: 0.4, armLz: 0.5, armRx: 0.4, armRz: 0.5, hipL: -0.35, kneeL: 0.8, hipR: -0.1, kneeR: 0.4 } },
  // take-off: the plant leg drives up, the body starts to fall backwards
  { t: 0.3, j: { h: 1.3, tilt: -0.5, spine: 0, head: -0.4, armLx: 0, armLz: 1.0, armRx: 0, armRz: 1.0, hipL: -0.9, kneeL: 1.2, hipR: -0.4, kneeR: 0.9 } },
  // in the air: the striking leg is cocked, the body is nearly flat
  { t: 0.4, j: { h: 1.62, tilt: -1.05, spine: -0.1, head: -0.2, armLx: -0.2, armLz: 1.2, armRx: -0.2, armRz: 1.2, hipL: -0.8, kneeL: 1.5, hipR: -1.0, kneeR: 1.7 } },
  // CONTACT: striking leg whipped up and straight, body almost horizontal
  { t: T_CONTACT, j: { h: 1.66, tilt: -1.32, spine: -0.15, head: -0.1, armLx: -0.3, armLz: 1.3, armRx: -0.3, armRz: 1.3, hipL: -0.7, kneeL: 1.4, hipR: -1.6, kneeR: 0.12 } },
  // follow-through
  { t: 0.58, j: { h: 1.45, tilt: -1.5, spine: -0.1, head: 0, armLx: -0.4, armLz: 1.3, armRx: -0.4, armRz: 1.3, hipL: -0.5, kneeL: 0.9, hipR: -1.3, kneeR: 0.5 } },
  // landing on the back
  { t: 0.8, j: { h: 0.28, tilt: -1.57, spine: 0, head: 0.1, armLx: -0.8, armLz: 1.0, armRx: -0.8, armRz: 1.0, hipL: -0.25, kneeL: 0.35, hipR: -0.3, kneeR: 0.3 } },
  { t: 1.0, j: { h: 0.2, tilt: -1.57, spine: 0, head: 0.1, armLx: -1.0, armLz: 0.8, armRx: -1.0, armRz: 0.8, hipL: -0.1, kneeL: 0.15, hipR: -0.15, kneeR: 0.15 } },
];

const smooth = (x: number) => x * x * (3 - 2 * x);

/** The body's joint angles at time t (0 to 1). */
export function jointsAt(t: number): Joints {
  const c = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < KEYS.length - 2 && c > KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const k = smooth(Math.min(1, Math.max(0, (c - a.t) / (b.t - a.t))));
  const out = {} as Joints;
  (Object.keys(a.j) as (keyof Joints)[]).forEach((key) => {
    out[key] = a.j[key] + (b.j[key] - a.j[key]) * k;
  });
  return out;
}
