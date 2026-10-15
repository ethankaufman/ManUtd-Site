import * as THREE from "three";

/**
 * The "printed comic" look, applied to the finished picture: colours snap to a few ink levels, the
 * mid-tones (the glows and the lit windows) break up into halftone dots, and the corners darken a little.
 */
export const ComicShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      vec3 q = floor(c * 7.0 + 0.5) / 7.0;                  // snap to a few ink levels
      c = mix(c, q, 0.5);
      float cell = max(5.0, uRes.y / 130.0);                 // halftone dots, 45 degrees
      float a = 0.7853982;
      mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
      vec2 f = fract((R * (vUv * uRes)) / cell) - 0.5;
      float radius = mix(0.55, 0.12, clamp((l - 0.05) / 0.55, 0.0, 1.0));
      float inside = smoothstep(radius + 0.07, radius - 0.07, length(f));
      float mid = smoothstep(0.05, 0.2, l) * (1.0 - smoothstep(0.5, 0.85, l));
      c = mix(c, c * 0.3, mid * (1.0 - inside) * 0.6);
      float v = length(vUv - 0.5);
      c *= 1.0 - 0.4 * smoothstep(0.4, 0.9, v);            // darker corners
      gl_FragColor = vec4(c, 1.0);
    }`,
};
