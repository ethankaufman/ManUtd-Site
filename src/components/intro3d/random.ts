/** A tiny seeded random-number generator, so the "hand-drawn" scene looks the same on every visit. */
export function makeRng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const smooth = (x: number) => x * x * (3 - 2 * x);
/** 0 below `a`, 1 above `b`, smooth in between. */
export const ramp = (x: number, a: number, b: number) => smooth(clamp((x - a) / (b - a)));
