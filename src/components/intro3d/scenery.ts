import * as THREE from "three";

import { makeRng } from "./random";
import { CANAL, CARS, CAR_PARKS, HOUSES, PARKS, RAIL, ROADS, TOWERS, TREES, WAREHOUSES, type Building } from "./layout";

/** Fog: the same formula is used by the flat materials (via scene.fog) and by the building shader below. */
export const FOG_DENSITY = 0.00052;

/**
 * Buildings are plain boxes. A small shader paints them: dark walls, and a grid of windows of which some are lit.
 * (Windows are worked out from where a point is in the world, so tall and short buildings get the same-sized windows.)
 */
function buildingMaterial(cellW: number, cellH: number, litChance: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCell: { value: new THREE.Vector2(cellW, cellH) },
      uLit: { value: litChance },
      uFog: { value: FOG_DENSITY },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vTint; varying float vSeed;
      void main() {
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vTint = instanceColor;
        vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec2 uCell; uniform float uLit; uniform float uFog;
      varying vec3 vWorld; varying vec3 vNormalW; varying vec3 vTint; varying float vSeed;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 col = vTint;
        if (abs(vNormalW.y) < 0.5) {
          float u = dot(vWorld.xz, vec2(-vNormalW.z, vNormalW.x));
          vec2 g = vec2(u / uCell.x, vWorld.y / uCell.y);
          vec2 id = floor(g); vec2 f = fract(g);
          bool win = f.x > 0.22 && f.x < 0.78 && f.y > 0.25 && f.y < 0.7 && vWorld.y > 1.5;
          if (win) {
            float r = hash(id + vSeed * 37.0);
            if (r < uLit) col = mix(vec3(1.0, 0.86, 0.35), vec3(1.0), 0.25 + 0.4 * hash(id * 3.1)) * (0.75 + 0.25 * hash(id + 9.0));
            else col = col * 0.35;
          }
          col *= 0.8 + 0.2 * clamp(vWorld.y / 30.0, 0.0, 1.0);
        } else {
          col *= 1.5;
        }
        float dist = length(vWorld - cameraPosition);
        float fogF = 1.0 - exp(-pow(dist * uFog, 2.0));
        col = mix(col, vec3(0.0), fogF);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

function boxes(list: Building[], material: THREE.ShaderMaterial, colors: [string, string]) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, material, list.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  const rng = makeRng(list.length + 3);
  const lines: number[] = [];
  list.forEach((b, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.angle);
    m.compose(new THREE.Vector3(b.x, 0, b.z), q, new THREE.Vector3(b.w, b.h, b.d));
    mesh.setMatrixAt(i, m);
    c.set(colors[b.tint]).multiplyScalar(0.8 + rng() * 0.4);
    mesh.setColorAt(i, c);
    // a white outline round the roof
    const cs = Math.cos(b.angle);
    const sn = Math.sin(b.angle);
    const corner = (sx: number, sz: number) => [b.x + (sx * b.w * cs + sz * b.d * sn) / 2, b.h, b.z + (-sx * b.w * sn + sz * b.d * cs) / 2];
    const p = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    for (let k = 0; k < 4; k++) lines.push(...p[k], ...p[(k + 1) % 4]);
  });
  mesh.frustumCulled = false;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  const outline = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xf0f0f0, transparent: true, opacity: 0.55 }));
  outline.frustumCulled = false;
  return [mesh, outline];
}

/** A flat strip along a path, for roads, rails and the canal. */
function ribbon(pts: number[][], width: number, y: number, color: number) {
  const pos: number[] = [];
  const idx: number[] = [];
  const left: number[][] = [];
  const right: number[][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const nx = -dz;
    const nz = dx;
    left.push([pts[i][0] + (nx * width) / 2, pts[i][1] + (nz * width) / 2]);
    right.push([pts[i][0] - (nx * width) / 2, pts[i][1] - (nz * width) / 2]);
    pos.push(left[i][0], y, left[i][1], right[i][0], y, right[i][1]);
    if (i > 0) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  return { mesh, left, right };
}

function line(pts: number[][], y: number, color: number, opacity: number, dash?: [number, number]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flatMap((p) => [p[0], y, p[1]]), 3));
  const l = new THREE.Line(
    g,
    dash
      ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: dash[0], gapSize: dash[1] })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  if (dash) l.computeLineDistances();
  l.frustumCulled = false;
  return l;
}

const shift = (pts: number[][], d: number) => ribbon(pts, 2 * d, 0, 0).left; // points offset sideways by d

export function buildScenery() {
  const group = new THREE.Group();

  // ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), new THREE.MeshBasicMaterial({ color: 0x1b1b1d }));
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // buildings
  group.add(...boxes(HOUSES, buildingMaterial(4.6, 3.6, 0.28), ["#050506", "#4a0c08"]));
  group.add(...boxes(WAREHOUSES, buildingMaterial(9, 5, 0.08), ["#08080a", "#5a0d08"]));
  group.add(...boxes(TOWERS, buildingMaterial(3.6, 3.2, 0.5), ["#0a0a0c", "#0a0a0c"]));

  // canal: black water, white banks and ripples
  const canal = ribbon(CANAL, 74, 0.04, 0x000000);
  group.add(canal.mesh, line(canal.left, 0.08, 0xffffff, 0.55), line(canal.right, 0.08, 0xffffff, 0.55));
  group.add(line(shift(CANAL, 10), 0.08, 0xffffff, 0.25, [10, 22]), line(shift(CANAL, -14), 0.08, 0xffffff, 0.22, [8, 28]));

  // railway
  const rail = ribbon(RAIL, 9, 0.05, 0x2a2a2c);
  group.add(rail.mesh, line(rail.left, 0.1, 0xffffff, 0.8), line(rail.right, 0.1, 0xffffff, 0.8), line(RAIL, 0.1, 0xffffff, 0.5, [3, 5]));

  // roads: dark grey, white edges, dashed centre line
  for (const r of ROADS) {
    const road = ribbon(r.pts, r.width, 0.05, 0x2c2c2f);
    group.add(road.mesh, line(road.left, 0.1, 0xffffff, 0.5), line(road.right, 0.1, 0xffffff, 0.5), line(r.pts, 0.1, 0xdddddd, 0.7, [7, 7]));
  }

  // parks and car parks
  for (const p of PARKS) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.d), new THREE.MeshBasicMaterial({ color: 0x101012 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, 0.05, p.z);
    group.add(m);
  }
  for (const c of CAR_PARKS) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(c.w, c.d), new THREE.MeshBasicMaterial({ color: 0x242426 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(c.x + c.w / 2, 0.06, c.z + c.d / 2);
    group.add(m);
    const x0 = c.x;
    const x1 = c.x + c.w;
    const z0 = c.z;
    const z1 = c.z + c.d;
    group.add(line([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], 0.12, 0xffffff, 0.7));
  }

  // trees
  const treeGeo = new THREE.ConeGeometry(1, 1, 7);
  treeGeo.translate(0, 0.5, 0);
  const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshBasicMaterial({ color: 0x1a1a1a }), TREES.length);
  const m4 = new THREE.Matrix4();
  TREES.forEach((t, i) => {
    m4.compose(new THREE.Vector3(t.x, 0, t.z), new THREE.Quaternion(), new THREE.Vector3(t.r, t.h, t.r));
    trees.setMatrixAt(i, m4);
  });
  group.add(trees);

  // cars
  const carGeo = new THREE.BoxGeometry(5.4, 1.5, 2.6);
  carGeo.translate(0, 0.75, 0);
  const cars = new THREE.InstancedMesh(carGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), CARS.length);
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  CARS.forEach((c, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), c.angle);
    m4.compose(new THREE.Vector3(c.x, 0.1, c.z), q, new THREE.Vector3(1, 1, 1));
    cars.setMatrixAt(i, m4);
    col.set(c.shade < 0.38 ? "#bdbdbd" : c.shade < 0.72 ? "#2a2a2a" : c.shade < 0.9 ? "#DA291C" : "#f2f2f2");
    cars.setColorAt(i, col);
  });
  group.add(cars);

  // street lights: warm dots along the main roads
  const lampPos: number[] = [];
  for (const r of ROADS.filter((x) => x.width >= 24)) {
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [x0, z0] = r.pts[i];
      const [x1, z1] = r.pts[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      const nx = -(z1 - z0) / len;
      const nz = (x1 - x0) / len;
      for (let s = 0; s < len; s += 34) {
        const x = x0 + ((x1 - x0) * s) / len;
        const z = z0 + ((z1 - z0) * s) / len;
        lampPos.push(x + nx * (r.width / 2 + 3), 9, z + nz * (r.width / 2 + 3), x - nx * (r.width / 2 + 3), 9, z - nz * (r.width / 2 + 3));
      }
    }
  }
  const lampGeo = new THREE.BufferGeometry();
  lampGeo.setAttribute("position", new THREE.Float32BufferAttribute(lampPos, 3));
  group.add(new THREE.Points(lampGeo, new THREE.PointsMaterial({ color: 0xffe9a8, size: 3.2, sizeAttenuation: true, transparent: true, opacity: 0.95 })));

  // a big pale moon, low over the city (drawn in the sky: it ignores fog)
  const moonCanvas = document.createElement("canvas");
  moonCanvas.width = moonCanvas.height = 256;
  const mctx = moonCanvas.getContext("2d")!;
  const grad = mctx.createRadialGradient(128, 128, 60, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.62, "rgba(255,255,255,1)");
  grad.addColorStop(0.64, "rgba(255,240,230,0.35)");
  grad.addColorStop(1, "rgba(255,240,230,0)");
  mctx.fillStyle = grad;
  mctx.beginPath();
  mctx.arc(128, 128, 128, 0, Math.PI * 2);
  mctx.fill();
  mctx.fillStyle = "rgba(0,0,0,0.16)";
  for (const [cx, cy, r] of [[100, 96, 20], [150, 140, 26], [118, 160, 12], [160, 92, 10], [92, 138, 9]]) {
    mctx.beginPath();
    mctx.arc(cx, cy, r, 0, Math.PI * 2);
    mctx.fill();
  }
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(moonCanvas), fog: false, depthWrite: false, transparent: true }));
  moon.position.set(5200, 1900, 1700);
  moon.scale.setScalar(900);
  group.add(moon);

  // stars (they ignore fog, so they stay visible at the horizon)
  const rng = makeRng(8);
  const starPos: number[] = [];
  for (let i = 0; i < 900; i++) {
    const a = rng() * Math.PI * 2;
    const e = 0.04 + rng() * 1.3;
    const r = 9000;
    starPos.push(r * Math.cos(a) * Math.cos(e), r * Math.sin(e), r * Math.sin(a) * Math.cos(e));
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.75 }));
  stars.frustumCulled = false;
  group.add(stars);

  return group;
}
