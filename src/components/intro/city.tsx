import { distToPolyline, polyline } from "./geometry";
import { makeRng } from "./random";
import { INK, RED } from "./stadium";

/**
 * The streets around Old Trafford as a stylised comic-book aerial view (not a real map): rows of
 * terraced houses, a canal, a railway line, roads, car parks and a few patches of trees.
 *
 * World coordinates match the stadium drawing: the stadium is at (0, 0).
 * To keep the zoom smooth, thousands of little shapes are packed into a handful of big SVG paths.
 */

export const WORLD = { halfW: 1900, halfH: 1300 };

const NS = { vectorEffect: "non-scaling-stroke" } as const;

const CANAL = [[-2000, -560], [-1000, -470], [-300, -740], [500, -820], [1200, -640], [2000, -720]];
const RAIL = [[-1300, 1300], [-550, 500], [-340, 150], [-320, -150], [-280, -520], [-100, -1000], [0, -1400]];
const ROADS = [
  [[400, 1400], [320, 700], [300, 0], [320, -500], [420, -1000], [520, -1400]], // the long road past the east side
  [[300, -40], [215, -40]], // feeder roads into the car parks
  [[300, 60], [215, 60]],
  [[-60, 330], [-60, 1300]],
  [[-1900, 640], [-300, 560], [300, 560], [1900, 700]],
];
const INDUSTRIAL = { x0: -1450, x1: -650, y0: 60, y1: 440 };
const PARKS = [
  { x: 560, y: 430, w: 200, h: 150 },
  { x: -640, y: -330, w: 220, h: 150 },
];
const CAR_PARKS = [
  { x: 150, y: -95, w: 135, h: 205 }, // east
  { x: -120, y: -205, w: 240, h: 66 }, // north
  { x: -120, y: 140, w: 240, h: 66 }, // south
  { x: -285, y: -65, w: 135, h: 165 }, // west
];

const rot = (x: number, y: number, a: number): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/** A slightly wobbly four-cornered shape, the way a person would draw it by hand. */
function wobblyQuad(corners: [number, number][], rng: () => number, j = 1.4): string {
  return corners.map(([x, y], i) => `${i ? "L" : "M"}${(x + (rng() - 0.5) * 2 * j).toFixed(1)},${(y + (rng() - 0.5) * 2 * j).toFixed(1)}`).join(" ") + " Z";
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${(cx - r).toFixed(1)},${cy.toFixed(1)} a${r.toFixed(1)},${r.toFixed(1)} 0 1,0 ${(2 * r).toFixed(1)},0 a${r.toFixed(1)},${r.toFixed(1)} 0 1,0 ${(-2 * r).toFixed(1)},0 Z`;
}

type Band = { outline: string; shade: string; roof: string; ridges: string };

/** Rows of terraced houses on two slightly different street grids, one each side of the railway. */
function buildHouses(): Band[] {
  const rng = makeRng(1910);
  const bands: Band[] = [0, 1, 2].map(() => ({ outline: "", shade: "", roof: "", ridges: "" }));
  const lattices = [
    { angle: (8 * Math.PI) / 180, keep: (x: number) => x > -300 },
    { angle: (-18 * Math.PI) / 180, keep: (x: number) => x < -360 },
  ];
  const cw = 112;
  const ch = 74;
  const bw = 96;
  const bh = 60;
  const R = 1250;
  for (const lat of lattices) {
    for (let i = -16; i <= 16; i++) {
      for (let j = -22; j <= 22; j++) {
        const [cx, cy] = rot(i * cw, j * ch, lat.angle);
        const dist = Math.hypot(cx, cy);
        if (dist > R || !lat.keep(cx)) continue;
        if ((Math.abs(cx) < 345 && Math.abs(cy) < 275) || dist < 430) continue; // the stadium, its car parks and the red ring
        if (distToPolyline(cx, cy, CANAL) < 78 || distToPolyline(cx, cy, RAIL) < 34) continue;
        if (ROADS.some((r) => distToPolyline(cx, cy, r) < 40)) continue;
        if (cx > INDUSTRIAL.x0 - 70 && cx < INDUSTRIAL.x1 + 70 && cy > INDUSTRIAL.y0 - 60 && cy < INDUSTRIAL.y1 + 60) continue;
        if (PARKS.some((p) => Math.abs(cx - p.x) < p.w / 2 + 55 && Math.abs(cy - p.y) < p.h / 2 + 45)) continue;
        if (rng() < 0.06) continue; // the odd empty plot
        const band = bands[dist < 650 ? 0 : dist < 950 ? 1 : 2];
        const corners = ([[-bw / 2, -bh / 2], [bw / 2, -bh / 2], [bw / 2, bh / 2], [-bw / 2, bh / 2]] as [number, number][]).map(([x, y]) => {
          const [rx, ry] = rot(x, y, lat.angle);
          return [cx + rx, cy + ry] as [number, number];
        });
        band.outline += wobblyQuad(corners, rng) + " ";
        // the shadowed strip down one side of the block
        const strip = ([[bw * 0.18, -bh / 2], [bw / 2, -bh / 2], [bw / 2, bh / 2], [bw * 0.18, bh / 2]] as [number, number][]).map(([x, y]) => {
          const [rx, ry] = rot(x, y, lat.angle);
          return [cx + rx, cy + ry] as [number, number];
        });
        band.shade += wobblyQuad(strip, rng, 0.6) + " ";
        if (rng() < 0.35) band.roof += wobblyQuad(corners.map(([x, y]) => [x, y] as [number, number]), rng, 0.4) + " ";
        // the ridge lines of the terraces
        for (const f of [-0.25, 0.25]) {
          const [x1, y1] = rot(-bw / 2 + 3, f * bh, lat.angle);
          const [x2, y2] = rot(bw / 2 - 3, f * bh, lat.angle);
          band.ridges += `M${(cx + x1).toFixed(1)},${(cy + y1).toFixed(1)} L${(cx + x2).toFixed(1)},${(cy + y2).toFixed(1)} `;
        }
      }
    }
  }
  return bands;
}

/** The big sheds of the industrial estate. */
function buildWarehouses() {
  const rng = makeRng(77);
  let white = "";
  let red = "";
  let ridges = "";
  for (let y = INDUSTRIAL.y0; y < INDUSTRIAL.y1 - 60; ) {
    const h = 50 + rng() * 38;
    for (let x = INDUSTRIAL.x0; x < INDUSTRIAL.x1 - 80; ) {
      const w = 90 + rng() * 80;
      const quad: [number, number][] = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      if (rng() < 0.14) red += wobblyQuad(quad, rng, 1) + " ";
      else white += wobblyQuad(quad, rng, 1) + " ";
      for (let k = 1; k < 5; k++) ridges += `M${x + 3},${(y + (h * k) / 5).toFixed(1)} L${(x + w - 3).toFixed(1)},${(y + (h * k) / 5).toFixed(1)} `;
      x += w + 14 + rng() * 14;
    }
    y += h + 16 + rng() * 10;
  }
  return { white, red, ridges };
}

function buildTrees() {
  const rng = makeRng(42);
  let trees = "";
  let shadows = "";
  for (const p of PARKS) {
    for (let n = 0; n < 34; n++) {
      const r = 4.5 + rng() * 5.5;
      const x = p.x + (rng() - 0.5) * (p.w - 14);
      const y = p.y + (rng() - 0.5) * (p.h - 14);
      trees += circlePath(x, y, r) + " ";
      shadows += circlePath(x + 2.4, y + 2.8, r) + " ";
    }
  }
  return { trees, shadows };
}

const HOUSES = buildHouses();
const WAREHOUSES = buildWarehouses();
const TREES = buildTrees();

/** The faraway city: just pale shading, because at this distance nobody can see individual streets. */
export function FarCity() {
  const x = -WORLD.halfW - 400;
  const y = -WORLD.halfH - 400;
  return (
    <g>
      <rect x={x} y={y} width={-x * 2} height={-y * 2} fill="#fff" />
      <rect x={x} y={y} width={-x * 2} height={-y * 2} fill="url(#hatch)" opacity={0.3} />
    </g>
  );
}

/** A red target ring with a halftone glow: the eye goes straight to the stadium from the first frame. */
export function Burst() {
  const ring = (r: number) => `M${-r},0 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`;
  return (
    <g>
      <path d={ring(560) + ring(398)} fillRule="evenodd" fill="url(#dotsRed)" />
      <circle cx={0} cy={0} r={390} fill="none" stroke={RED} strokeWidth={18} />
      <circle cx={0} cy={0} r={399} fill="none" stroke={INK} strokeWidth={2.4} {...NS} />
      <circle cx={0} cy={0} r={381} fill="none" stroke={INK} strokeWidth={2.4} {...NS} />
    </g>
  );
}

/** Streets, canal, railway and industrial estate. */
export function City() {
  const opacities = [1, 0.85, 0.6];
  return (
    <g>
      {/* the canal: halftone water inside black banks */}
      <path d={polyline(CANAL)} fill="none" stroke={INK} strokeWidth={84} strokeLinejoin="round" />
      <path d={polyline(CANAL)} fill="none" stroke="#fff" strokeWidth={74} strokeLinejoin="round" />
      <path d={polyline(CANAL)} fill="none" stroke="url(#dotsDark)" strokeWidth={74} strokeLinejoin="round" />
      <path d={polyline(CANAL.map(([x, y]) => [x, y - 4]))} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="26 40" strokeLinecap="round" strokeLinejoin="round" />
      <path d={polyline(CANAL.map(([x, y]) => [x + 20, y + 16]))} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="22 46" strokeLinecap="round" strokeLinejoin="round" />

      {/* houses, nearest first */}
      {HOUSES.map((b, i) => (
        <g key={i} opacity={opacities[i]}>
          <path d={b.outline} fill="#fff" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" {...NS} />
          <path d={b.roof} fill="url(#hatch)" />
          <path d={b.shade} fill="url(#dotsDark)" />
          <path d={b.ridges} fill="none" stroke={INK} strokeWidth={0.7} opacity={0.7} {...NS} />
        </g>
      ))}

      {/* industrial estate */}
      <path d={WAREHOUSES.white} fill="#fff" stroke={INK} strokeWidth={1.6} {...NS} />
      <path d={WAREHOUSES.red} fill={RED} stroke={INK} strokeWidth={1.6} {...NS} />
      <path d={WAREHOUSES.white} fill="url(#hatch)" opacity={0.5} />
      <path d={WAREHOUSES.ridges} fill="none" stroke={INK} strokeWidth={0.7} opacity={0.6} {...NS} />

      {/* roads: black outline, white middle, dashed centre line */}
      {ROADS.map((r, i) => (
        <g key={i}>
          <path d={polyline(r)} fill="none" stroke={INK} strokeWidth={i === 0 || i === 4 ? 24 : 18} strokeLinecap="round" strokeLinejoin="round" />
          <path d={polyline(r)} fill="none" stroke="#fff" strokeWidth={i === 0 || i === 4 ? 19 : 13.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={polyline(r)} fill="none" stroke={INK} strokeWidth={1.2} strokeDasharray="9 8" {...NS} />
        </g>
      ))}

      {/* the railway: a black line with white sleepers */}
      <path d={polyline(RAIL)} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d={polyline(RAIL)} fill="none" stroke="#fff" strokeWidth={4.6} strokeDasharray="8 8" strokeLinejoin="round" />
    </g>
  );
}

/** Close to the stadium: car parks full of cars, and patches of trees. */
export function Surroundings() {
  return (
    <g>
      {PARKS.map((p, i) => (
        <rect key={i} x={p.x - p.w / 2} y={p.y - p.h / 2} width={p.w} height={p.h} fill="#fff" stroke={INK} strokeWidth={1.6} strokeDasharray="6 4" {...NS} />
      ))}
      <path d={TREES.shadows} fill={INK} opacity={0.4} />
      <path d={TREES.trees} fill="url(#dotsDark)" stroke={INK} strokeWidth={1.2} {...NS} />
      {CAR_PARKS.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="#fff" stroke={INK} strokeWidth={2} {...NS} />
          <rect x={c.x + 3} y={c.y + 3} width={c.w - 6} height={c.h - 6} fill="url(#cars)" />
        </g>
      ))}
    </g>
  );
}
