import * as THREE from "three";

/**
 * A stylised player (a faceless white "mannequin" in a red shirt, white shorts and black socks and boots),
 * built from simple shapes with joints we can bend. No real person's likeness.
 *
 * Units are metres. The figure's origin is the middle of the hips, which is 0.95 m above the ground when standing.
 * Rotations are in radians about the x axis (the figure faces +z):
 *   - a NEGATIVE hip rotation swings a leg forward, a POSITIVE knee rotation bends the knee,
 *   - a NEGATIVE body tilt leans the whole body backwards.
 */

const RED = 0xda291c;
const WHITE = 0xf2f2f2;
const BLACK = 0x111111;

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
  foot: THREE.Object3D; // the striking foot, used to place the ball at the moment of contact
  apply: (j: Joints) => void;
  dispose: () => void;
};

function mat(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0 });
}

/** A limb segment hanging down from its joint (the joint is the top of the segment). */
function limb(radius: number, length: number, material: THREE.Material) {
  const g = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 4, 10), material);
  g.position.y = -length / 2;
  return g;
}

export function createFigure(): Figure {
  const root = new THREE.Group();
  const red = mat(RED);
  const white = mat(WHITE);
  const black = mat(BLACK);
  const geometries: THREE.BufferGeometry[] = [];

  // hips (white shorts)
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.22), white);
  root.add(pelvis);

  // upper body
  const spine = new THREE.Group();
  spine.position.y = 0.1;
  root.add(spine);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.56, 0.24), red);
  torso.position.y = 0.28;
  spine.add(torso);
  const head = new THREE.Group();
  head.position.y = 0.62;
  spine.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), white);
  skull.position.y = 0.13;
  head.add(skull);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 10), white);
  neck.position.y = 0.04;
  head.add(neck);

  // arms: red sleeve on the upper arm, white forearm
  function arm(side: 1 | -1) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.26 * side, 0.52, 0);
    const upper = limb(0.055, 0.3, red);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    elbow.add(limb(0.045, 0.28, white));
    shoulder.add(upper, elbow);
    spine.add(shoulder);
    return { shoulder, elbow };
  }
  const armL = arm(1);
  const armR = arm(-1);

  // legs: white thigh (shorts and skin), black sock/shin, black boot
  function leg(side: 1 | -1) {
    const hip = new THREE.Group();
    hip.position.set(0.1 * side, -0.08, 0);
    hip.add(limb(0.075, 0.46, white));
    const knee = new THREE.Group();
    knee.position.y = -0.46;
    knee.add(limb(0.055, 0.46, black));
    const foot = new THREE.Group();
    foot.position.y = -0.46;
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.26), black);
    boot.position.set(0, -0.02, 0.07);
    foot.add(boot);
    knee.add(foot);
    hip.add(knee);
    root.add(hip);
    return { hip, knee, foot };
  }
  const legL = leg(1);
  const legR = leg(-1);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      geometries.push(o.geometry);
      o.castShadow = true;
    }
  });

  function apply(j: Joints) {
    root.position.y = j.h;
    root.rotation.x = j.tilt;
    spine.rotation.x = j.spine;
    head.rotation.x = j.head;
    armL.shoulder.rotation.set(j.armLx, 0, j.armLz);
    armR.shoulder.rotation.set(j.armRx, 0, -j.armRz);
    armL.elbow.rotation.x = -0.3;
    armR.elbow.rotation.x = -0.3;
    legL.hip.rotation.x = j.hipL;
    legL.knee.rotation.x = j.kneeL;
    legR.hip.rotation.x = j.hipR;
    legR.knee.rotation.x = j.kneeR;
  }

  return {
    root,
    foot: legR.foot,
    apply,
    dispose() {
      geometries.forEach((g) => g.dispose());
      [red, white, black].forEach((m) => m.dispose());
    },
  };
}
