/**
 * Shapes for the Old Trafford drawing. Everything is measured in "world units" (1 unit is
 * about 0.9 metres) with the middle of the stadium at (0, 0).
 */

/** SVG path for a rounded rectangle centred on (0, 0). */
export function rrPath(hw: number, hh: number, r: number): string {
  return (
    `M${-hw + r},${-hh} H${hw - r} A${r},${r} 0 0 1 ${hw},${-hh + r} V${hh - r} ` +
    `A${r},${r} 0 0 1 ${hw - r},${hh} H${-hw + r} A${r},${r} 0 0 1 ${-hw},${hh - r} ` +
    `V${-hh + r} A${r},${r} 0 0 1 ${-hw + r},${-hh} Z`
  );
}

export type EdgePoint = { x: number; y: number; nx: number; ny: number };

/** Total length around a rounded rectangle. */
export function rrLength(hw: number, hh: number, r: number): number {
  return 4 * (hw - r) + 4 * (hh - r) + 2 * Math.PI * r;
}

/**
 * A point `s` units clockwise along the edge of a rounded rectangle, plus the direction pointing
 * straight out of the edge. Walking along that direction by `d` lands exactly on the edge of the
 * same rectangle made `d` bigger, which is how the stands, aisles and roof panels line up.
 */
export function edgePoint(hw: number, hh: number, r: number, s: number): EdgePoint {
  const a = 2 * (hw - r);
  const b = 2 * (hh - r);
  const q = (Math.PI / 2) * r;
  const total = 2 * a + 2 * b + 4 * q;
  s = ((s % total) + total) % total;
  const arc = (cx: number, cy: number, start: number, t: number): EdgePoint => {
    const ang = start + t / r;
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), nx: Math.cos(ang), ny: Math.sin(ang) };
  };
  if (s < a) return { x: -hw + r + s, y: -hh, nx: 0, ny: -1 };
  s -= a;
  if (s < q) return arc(hw - r, -hh + r, -Math.PI / 2, s);
  s -= q;
  if (s < b) return { x: hw, y: -hh + r + s, nx: 1, ny: 0 };
  s -= b;
  if (s < q) return arc(hw - r, hh - r, 0, s);
  s -= q;
  if (s < a) return { x: hw - r - s, y: hh, nx: 0, ny: 1 };
  s -= a;
  if (s < q) return arc(-hw + r, hh - r, Math.PI / 2, s);
  s -= q;
  if (s < b) return { x: -hw, y: hh - r - s, nx: -1, ny: 0 };
  s -= b;
  return arc(-hw + r, -hh + r, Math.PI, s);
}

/** Distance from point (px, py) to the line segment (ax, ay)-(bx, by). */
export function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distance from a point to a polyline (a list of [x, y] points). */
export function distToPolyline(px: number, py: number, pts: number[][]): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    best = Math.min(best, distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  }
  return best;
}

/** "M x,y L x,y ..." for a list of points. */
export const polyline = (pts: number[][]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
