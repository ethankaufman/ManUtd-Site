import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

import { ComicShader } from "./comic";
import { pose } from "./flight";
import { buildScenery, FOG_DENSITY } from "./scenery";
import { ramp } from "./random";
import { buildStadium } from "./stadium3d";

/**
 * Builds the whole night-time scene and gives back three simple controls: resize, render (for a scroll position), dispose.
 * Loaded on demand (see Intro3D.tsx), so the 3D library is not part of the first page load.
 */
export function createScene(canvas: HTMLCanvasElement, options: { lowPower?: boolean } = {}) {
  // colours are used exactly as written (no colour-space conversion), which keeps the palette predictable
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, FOG_DENSITY);
  const camera = new THREE.PerspectiveCamera(64, 1, 0.5, 16000);

  scene.add(buildScenery());
  const stadium = buildStadium(renderer.capabilities.getMaxAnisotropy());
  scene.add(stadium.group);

  const target = new THREE.WebGLRenderTarget(4, 4, { samples: options.lowPower ? 2 : 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const comic = new ShaderPass(ComicShader);
  composer.addPass(comic);

  function resize(w: number, h: number, dpr: number) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    comic.uniforms.uRes.value.set(w * dpr, h * dpr);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render(p: number) {
    const s = pose(p);
    camera.position.copy(s.position);
    camera.up.copy(s.up);
    camera.lookAt(s.target);
    // on tall (phone) screens widen the field of view so the stadium still fits
    camera.fov = camera.aspect < 1 ? Math.min(95, s.fov / Math.max(0.55, camera.aspect) ** 0.6) : s.fov;
    camera.updateProjectionMatrix();
    // the red glow over the stadium would tint the pitch once we are inside, so fade it out as we get close
    (stadium.halo.material as THREE.SpriteMaterial).opacity = ramp(s.position.length(), 170, 480);
    composer.render();
  }

  function dispose() {
    composer.dispose();
    renderer.dispose();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m?.dispose?.();
    });
  }

  return { resize, render, dispose, ball: stadium.ball };
}

export type IntroScene = ReturnType<typeof createScene>;
