import * as THREE from "three";

/**
 * A stylised footballer: a faceless, smooth "mannequin" in a red shirt, white shorts, black socks and boots,
 * built from rounded shapes with joints we can bend. No real person's likeness.
 *
 * Units are metres; the figure stands about 1.8 m tall. The origin is the middle of the hips (0.95 m above the
 * ground when standing) and the figure faces +z. Rotations are about the x axis:
 *   - a NEGATIVE hip rotation swings a leg forward, a POSITIVE knee rotation bends the knee,
 *   - a NEGATIVE body tilt leans the whole body backwards.
 */

const RED = 0xda291c;
const SKIN = 0xe4e4e4;
const WHITE = 0xf5f5f5;
const BLACK = 0x141414;

export type Joints = {
  h: number; // hip height above the ground
  tilt: number; // whole-body lean (negative = backwards)
  spine: number; // extra bend of the upper body
  head: number;
  armLx: number;
  armLz: number;
  armRx: number;
  armRz: number;
  hipL: number; // plant leg
  kneeL: number;
  hipR: number; // striking leg
  kneeR: number;
};

export type Figure = {
  root: THREE.Group;
  strike: THREE.Object3D; // the spot on the striking boot that meets the ball
  apply: (j: Joints) => void;
  dispose: () => void;
};

function shirtNumberTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#da291c";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#ffffff";
  g.font = "bold 92px Arial, Helvetica, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("10", 64, 70);
  return new THREE.CanvasTexture(c);
}

export function createFigure(): Figure {
  const root = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };
  const std = (color: number, roughness = 0.7) => track(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }));
  const skin = std(SKIN, 0.55);
  const red = std(RED, 0.8);
  const white = std(WHITE, 0.8);
  const black = std(BLACK, 0.6);
  const hair = std(0x1c1c1c, 0.9);
  const numberTex = track(shirtNumberTexture());
  const numberMat = track(new THREE.MeshStandardMaterial({ map: numberTex, roughness: 0.8 }));

  const unit = track(new THREE.SphereGeometry(1, 28, 18));

  /** A smooth egg-shaped blob. */
  function blob(rx: number, ry: number, rz: number, material: THREE.Material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(unit, material);
    m.scale.set(rx, ry, rz);
    m.position.set(x, y, z);
    return m;
  }

  /** A limb segment hanging down from its joint, narrowing from rTop to rBottom, with a rounded bottom end. */
  function segment(rTop: number, rBottom: number, length: number, material: THREE.Material, y0 = 0) {
    const g = new THREE.Group();
    g.position.y = y0;
    const body = new THREE.Mesh(track(new THREE.CylinderGeometry(rTop, rBottom, length, 24, 1, true)), material);
    body.position.y = -length / 2;
    g.add(body, blob(rTop, rTop, rTop, material), blob(rBottom, rBottom, rBottom, material, 0, -length, 0));
    return g;
  }

  // ---- hips and shorts
  root.add(blob(0.175, 0.115, 0.115, white));

  // ---- upper body
  const spine = new THREE.Group();
  spine.position.y = 0.06;
  root.add(spine);
  spine.add(blob(0.15, 0.15, 0.1, red, 0, 0.1, 0)); // belly
  spine.add(blob(0.205, 0.2, 0.125, red, 0, 0.34, 0)); // chest and shoulders
  const plate = new THREE.Mesh(track(new THREE.PlaneGeometry(0.22, 0.22)), numberMat);
  plate.position.set(0, 0.36, -0.1245);
  plate.rotation.y = Math.PI; // faces backwards, like a shirt number
  spine.add(plate);
  const neckBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.048, 0.055, 0.1, 16)), skin);
  neckBase.position.y = 0.56;
  spine.add(neckBase);
  const collar = new THREE.Mesh(track(new THREE.TorusGeometry(0.066, 0.014, 10, 24)), white);
  collar.position.y = 0.53;
  collar.rotation.x = Math.PI / 2;
  spine.add(collar);

  const head = new THREE.Group();
  head.position.y = 0.6;
  spine.add(head);
  head.add(blob(0.092, 0.118, 0.1, skin, 0, 0.1, 0.005));
  const cap = new THREE.Mesh(track(new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56)), hair);
  cap.scale.set(0.098, 0.124, 0.108);
  cap.position.set(0, 0.105, -0.004);
  head.add(cap);

  // ---- arms: red sleeve, bare forearm, hand
  function arm(side: 1 | -1) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.215 * side, 0.45, 0);
    shoulder.add(segment(0.055, 0.047, 0.27, red));
    const elbow = new THREE.Group();
    elbow.position.y = -0.27;
    elbow.add(segment(0.042, 0.032, 0.26, skin));
    elbow.add(blob(0.034, 0.056, 0.024, skin, 0, -0.3, 0));
    shoulder.add(elbow);
    spine.add(shoulder);
    return { shoulder, elbow };
  }
  const armL = arm(1);
  const armR = arm(-1);

  // ---- legs: white shorts over the thigh, black sock over the shin, black boot with a white sole
  function leg(side: 1 | -1) {
    const hip = new THREE.Group();
    hip.position.set(0.095 * side, -0.07, 0);
    hip.add(segment(0.088, 0.062, 0.45, skin));
    hip.add(segment(0.1, 0.092, 0.2, white));
    const knee = new THREE.Group();
    knee.position.y = -0.45;
    knee.add(segment(0.062, 0.04, 0.43, black));
    const foot = new THREE.Group();
    foot.position.y = -0.43;
    foot.add(blob(0.047, 0.05, 0.135, black, 0, -0.035, 0.05));
    const sole = new THREE.Mesh(track(new THREE.BoxGeometry(0.09, 0.016, 0.27)), white);
    sole.position.set(0, -0.082, 0.06);
    foot.add(sole);
    const strike = new THREE.Object3D();
    strike.position.set(0, 0.005, 0.085); // the laces
    foot.add(strike);
    knee.add(foot);
    hip.add(knee);
    root.add(hip);
    return { hip, knee, strike };
  }
  const legL = leg(1);
  const legR = leg(-1);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });

  function apply(j: Joints) {
    root.position.y = j.h;
    root.rotation.x = j.tilt;
    spine.rotation.x = j.spine;
    head.rotation.x = j.head;
    armL.shoulder.rotation.set(j.armLx, 0, j.armLz);
    armR.shoulder.rotation.set(j.armRx, 0, -j.armRz);
    armL.elbow.rotation.x = -0.35;
    armR.elbow.rotation.x = -0.35;
    legL.hip.rotation.x = j.hipL;
    legL.knee.rotation.x = j.kneeL;
    legR.hip.rotation.x = j.hipR;
    legR.knee.rotation.x = j.kneeR;
  }

  return {
    root,
    strike: legR.strike,
    apply,
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
