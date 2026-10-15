import { edgePoint, rrLength, rrPath } from "./geometry";

/**
 * Old Trafford from directly above, drawn in a graphic-novel style: thick ink outlines, halftone
 * dots and hatching, and only the United colours (red, black, white).
 *
 * The drawing is centred on (0, 0). Sizes are in "world units" (1 unit is about 0.9 m), so the pitch
 * (105 x 68 m) is 120 x 78 units. Outlines use non-scaling strokes, so the ink stays the same
 * thickness on screen however far the camera has zoomed in.
 */

export const RED = "#DA291C";
export const INK = "#000000";

// pitch
const PW = 60; // half length
const PH = 39; // half width
const K = 120 / 105; // units per metre

// the bowl: a rounded rectangle just outside the pitch, then rings growing outwards
const BW = 70;
const BH = 49;
const BR = 16;
const LOWER = 22; // depth of the lower tier
const GAP = 4; // walkway between the tiers
const UPPER = 26; // depth of the upper tier
const ROOF = 10; // roof overhang
export const OUTER = LOWER + GAP + UPPER + ROOF; // 62
export const STADIUM_HALF_WIDTH = BW + OUTER; // 132
export const STADIUM_HALF_HEIGHT = BH + OUTER; // 111

const ring = (d: number) => rrPath(BW + d, BH + d, BR + d);
const NS = { vectorEffect: "non-scaling-stroke" } as const;

/** Lines that run from one ring to another, evenly spaced around the bowl (stairways, roof seams). */
function spokes(count: number, from: number, to: number): string {
  const total = rrLength(BW, BH, BR);
  let d = "";
  for (let i = 0; i < count; i++) {
    const p = edgePoint(BW, BH, BR, (i * total) / count + total / count / 2);
    d += `M${(p.x + p.nx * from).toFixed(1)},${(p.y + p.ny * from).toFixed(1)} L${(p.x + p.nx * to).toFixed(1)},${(p.y + p.ny * to).toFixed(1)} `;
  }
  return d;
}

/** Concentric rows of seats. */
function seatRows(from: number, to: number, count: number): string {
  let d = "";
  for (let i = 1; i < count; i++) d += ring(from + ((to - from) * i) / count) + " ";
  return d;
}

/** The white markings on the pitch. */
function pitchMarkings(): string {
  const boxD = 16.5 * K;
  const boxH = 20.16 * K;
  const sixD = 5.5 * K;
  const sixH = 9.16 * K;
  const spot = 11 * K; // penalty spot, measured from the goal line
  const r = 9.15 * K; // radius of the centre circle and the penalty arcs
  const arcY = Math.sqrt(r * r - (spot - boxD) ** 2);
  let d = `M${-PW},${-PH} H${PW} V${PH} H${-PW} Z M0,${-PH} V${PH} `;
  for (const s of [-1, 1]) {
    d += `M${s * PW},${-boxH} H${s * (PW - boxD)} V${boxH} H${s * PW} `;
    d += `M${s * PW},${-sixH} H${s * (PW - sixD)} V${sixH} H${s * PW} `;
  }
  // centre circle, centre spot and the two penalty spots
  d += `M${r},0 A${r},${r} 0 1 1 ${-r},0 A${r},${r} 0 1 1 ${r},0 `;
  for (const sx of [-1, 1]) d += `M${sx * (PW - spot) - 0.5},0 h1 `;
  // penalty arcs, only the part outside the box
  d += `M${-(PW - boxD)},${-arcY} A${r},${r} 0 0 1 ${-(PW - boxD)},${arcY} `;
  d += `M${PW - boxD},${arcY} A${r},${r} 0 0 1 ${PW - boxD},${-arcY} `;
  return d;
}

/** Everything you can see from far away: the shadow, roof, both tiers and the pitch. */
export function StadiumBase() {
  const stripes = Array.from({ length: 12 }, (_, i) => i);
  return (
    <g>
      {/* comic drop shadow */}
      <path d={ring(OUTER)} transform="translate(15 15)" fill="url(#dotsDark)" />
      {/* roof */}
      <path d={ring(OUTER)} fill="#fff" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" {...NS} />
      <path d={ring(OUTER)} fill="url(#hatch)" opacity={0.55} />
      {/* upper tier */}
      <path d={ring(LOWER + GAP + UPPER)} fill={RED} stroke={INK} strokeWidth={2.4} {...NS} />
      {/* walkway between the tiers */}
      <path d={ring(LOWER + GAP)} fill="#fff" stroke={INK} strokeWidth={1.6} {...NS} />
      {/* lower tier */}
      <path d={ring(LOWER)} fill={RED} stroke={INK} strokeWidth={2.4} {...NS} />
      <path d={ring(LOWER)} fill="url(#dotsDark)" opacity={0.45} />
      {/* the pitch surround and the pitch itself, striped like freshly cut grass */}
      <path d={ring(0)} fill="#0b0b0b" stroke={INK} strokeWidth={3} {...NS} />
      <clipPath id="pitchClip">
        <rect x={-PW} y={-PH} width={PW * 2} height={PH * 2} />
      </clipPath>
      <g clipPath="url(#pitchClip)">
        <rect x={-PW} y={-PH} width={PW * 2} height={PH * 2} fill="#161616" />
        {stripes.map((i) => (
          <rect key={i} x={-PW + i * 10} y={-PH} width={10} height={PH * 2} fill={i % 2 ? "#232323" : "#0e0e0e"} />
        ))}
      </g>
      <path d={pitchMarkings()} fill="none" stroke="#fff" strokeWidth={1.3} {...NS} />
    </g>
  );
}

/** Close-up detail: seat rows, stairways, roof seams, dugouts, the players and the ball. */
export function StadiumDetails() {
  const united: [number, number][] = [
    [-57, 0], // goalkeeper
    [-42, -24], [-42, -8], [-42, 8], [-42, 24],
    [-26, -26], [-26, -9], [-26, 9], [-26, 26],
    [-3, 0], [-5, 5], // the kick-off pair
  ];
  const rivals: [number, number][] = [
    [57, 0],
    [42, -24], [42, -8], [42, 8], [42, 24],
    [26, -26], [26, -9], [26, 9], [26, 26],
    [14, -8], [14, 8],
  ];
  return (
    <g>
      {/* roof seams */}
      <path d={spokes(96, LOWER + GAP + UPPER, OUTER)} fill="none" stroke={INK} strokeWidth={0.9} {...NS} />
      <path d={ring(OUTER - 4)} fill="none" stroke={INK} strokeWidth={0.9} {...NS} />
      {/* rows of seats */}
      <path d={seatRows(LOWER + GAP, LOWER + GAP + UPPER, 11)} fill="none" stroke={INK} strokeWidth={0.8} opacity={0.5} {...NS} />
      <path d={seatRows(0, LOWER, 9)} fill="none" stroke={INK} strokeWidth={0.8} opacity={0.55} {...NS} />
      {/* stairways */}
      <path d={spokes(46, 0, LOWER)} fill="none" stroke={INK} strokeWidth={1.1} {...NS} />
      <path d={spokes(46, LOWER + GAP, LOWER + GAP + UPPER)} fill="none" stroke={INK} strokeWidth={1.1} {...NS} />
      {/* advertising boards: a dashed white ring around the pitch */}
      <path d={rrPath(PW + 3, PH + 3, 3)} fill="none" stroke="#fff" strokeWidth={1.8} strokeDasharray="4 1.5" {...NS} />
      {/* the tunnel and the two dugouts */}
      <rect x={-5} y={BH - 1} width={10} height={13} fill={INK} stroke="#fff" strokeWidth={1} {...NS} />
      {[-1, 1].map((s) => (
        <rect key={s} x={s * 15 - 7} y={PH + 5} width={14} height={3.2} rx={1.2} fill={RED} stroke="#fff" strokeWidth={1} {...NS} />
      ))}
      {/* the players at kick-off: United in red, the visitors in white */}
      {[...united.map((p) => [...p, true] as const), ...rivals.map((p) => [...p, false] as const)].map(([x, y, home], i) => (
        <g key={i}>
          <ellipse cx={x + 0.7} cy={y + 1} rx={2.1} ry={1.7} fill="#000" opacity={0.55} />
          <circle cx={x} cy={y} r={1.9} fill={home ? RED : "#fff"} stroke={home ? "#fff" : INK} strokeWidth={1.4} {...NS} />
        </g>
      ))}
      {/* the ball on the centre spot */}
      <circle cx={0} cy={0} r={1.15} fill="#fff" stroke={INK} strokeWidth={1.3} {...NS} />
    </g>
  );
}
