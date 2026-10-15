"use client";

import { useEffect, useRef, useState } from "react";

import { clamp, makeRng, ramp } from "./random";

/**
 * The opening of the site: a night-time flight over Manchester that swoops, spirals down and lands
 * at the tunnel of Old Trafford, facing the pitch, as you scroll. We see it through the flyer's eyes.
 *
 * How it works (in plain words):
 *  - The page is six screens tall, but the picture is "sticky": it stays on screen while you scroll.
 *  - How far you have scrolled (0 to 1) decides where the camera is on its flight (see flight.ts).
 *  - The 3D scene (scene3d.ts) is loaded on demand. A small animation loop eases towards the scroll position.
 *  - Add ?p=0.5 to the address to freeze the flight at 50% (handy for screenshots). ?v=0.01 shows the speed lines.
 */

const CAPTIONS = [
  { from: -0.05, to: 0.2, pos: "tl", big: "Manchester, England.", small: "Red brick. Rain. And one unmistakable roar." },
  { from: 0.2, to: 0.47, pos: "br", big: "Sir Matt Busby Way, Stretford.", small: "" },
  { from: 0.47, to: 0.74, pos: "tl", big: "Old Trafford. Opened 1910.", small: "Over 74,000 seats." },
  { from: 0.78, to: 0.9, pos: "br", big: "The Theatre of Dreams.", small: "" },
] as const;

/** Thin black wedges pointing at the middle of the screen: comic "speed lines". */
const SPEED_LINES = (() => {
  const rng = makeRng(7);
  return Array.from({ length: 90 }, (_, i) => {
    const a = ((i + rng() * 0.8) / 90) * Math.PI * 2;
    const inner = 38 + rng() * 40;
    const half = 0.004 + rng() * 0.012;
    const pt = (r: number, da: number) => `${(Math.cos(a + da) * r).toFixed(1)},${(Math.sin(a + da) * r).toFixed(1)}`;
    return `${pt(inner, 0)} ${pt(160, -half * 4)} ${pt(160, half * 4)}`;
  });
})();

export default function Intro3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef<SVGSVGElement>(null);
  const sfxRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !stage || !canvas) return;

    const params = new URLSearchParams(window.location.search);
    const frozen = params.get("p") !== null ? clamp(parseFloat(params.get("p") ?? "0") || 0) : null;
    const previewSpeed = parseFloat(params.get("v") ?? "0") || 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (frozen !== null || reduceMotion) wrap.style.height = "100vh";

    let target = frozen ?? (reduceMotion ? 1 : 0);
    let current = target;
    let shown = -1;
    let speed = previewSpeed;
    let raf = 0;
    let disposed = false;
    let scene: import("./scene3d").IntroScene | null = null;

    function overlays(p: number, speedNow: number) {
      CAPTIONS.forEach((c, i) => {
        const el = capRefs.current[i];
        if (!el) return;
        const o = ramp(p, c.from, c.from + 0.04) * (1 - ramp(p, c.to - 0.04, c.to));
        el.style.opacity = o.toFixed(3);
        el.style.transform = `rotate(${c.pos === "tl" ? -1.4 : 1.2}deg) translateY(${((1 - o) * 14).toFixed(1)}px)`;
      });
      const t = ramp(p, 0.91, 0.98);
      if (titleRef.current) {
        titleRef.current.style.opacity = t.toFixed(3);
        titleRef.current.style.transform = `scale(${(1.3 - 0.3 * t).toFixed(3)})`;
      }
      // speed lines and the WHOOSH, only while the camera is moving fast
      const fast = clamp((speedNow - 0.0015) * 70);
      if (speedRef.current) speedRef.current.style.opacity = (fast * 0.85).toFixed(3);
      if (sfxRef.current) {
        sfxRef.current.style.opacity = clamp(fast * 1.4 - 0.2).toFixed(3);
        sfxRef.current.style.transform = `rotate(-7deg) scale(${(0.9 + fast * 0.35).toFixed(3)})`;
      }
      if (hintRef.current) hintRef.current.style.opacity = (1 - ramp(p, 0.01, 0.06)).toFixed(3);
    }

    function resize() {
      const box = stage!.getBoundingClientRect();
      if (!scene || !box.width || !box.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, box.width < 700 ? 1.5 : 1.6);
      scene.resize(Math.round(box.width), Math.round(box.height), dpr);
      shown = -1;
    }

    function tick() {
      raf = 0;
      const previous = current;
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0004) current = target;
      speed = frozen !== null ? previewSpeed : speed * 0.8 + Math.abs(current - previous) * 0.2;
      if (current !== shown || speed > 0.0001) {
        shown = current;
        scene?.render(current);
        overlays(current, speed);
      }
      if (current !== target || speed > 0.0001) raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (frozen === null && !reduceMotion) {
        const r = wrap!.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        target = total > 0 ? clamp(-r.top / total) : 0;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    // load the 3D scene, then start
    import("./scene3d")
      .then(({ createScene }) => {
        if (disposed) return;
        scene = createScene(canvas, { lowPower: window.innerWidth < 700 });
        resize();
        if (loadingRef.current) loadingRef.current.style.display = "none";
        kick();
      })
      .catch((err) => {
        console.warn("The 3D intro could not start:", err);
        if (!disposed) window.setTimeout(() => setFailed(true), 0);
      });

    const observer = new ResizeObserver(() => {
      resize();
      kick();
    });
    observer.observe(stage);
    window.addEventListener("scroll", kick, { passive: true });
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("scroll", kick);
      if (raf) cancelAnimationFrame(raf);
      scene?.dispose();
    };
  }, []);

  return (
    <section ref={wrapRef} style={{ height: "600vh" }} aria-label="Introduction: a night-time flight from Manchester down to Old Trafford">
      <div className="sticky top-0 h-screen w-full bg-black p-2 sm:p-3">
        <div ref={stageRef} className="relative h-full w-full overflow-hidden border-[5px] border-white bg-black">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

          {/* shown until the 3D scene is ready (and kept if the browser cannot show 3D) */}
          <div ref={loadingRef} className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="font-sfx text-3xl uppercase tracking-wide text-united-red sm:text-5xl">{failed ? "Manchester United" : "Lighting up the night…"}</p>
          </div>

          {/* speed lines */}
          <svg ref={speedRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" viewBox="-100 -100 200 200" preserveAspectRatio="none" aria-hidden="true">
            {SPEED_LINES.map((pts, i) => (
              <polygon key={i} points={pts} fill="#ffffff" fillOpacity={0.85} />
            ))}
          </svg>

          {/* comic caption boxes */}
          {CAPTIONS.map((c, i) => (
            <div
              key={c.big}
              ref={(el) => {
                capRefs.current[i] = el;
              }}
              className={`pointer-events-none absolute max-w-[min(22rem,80%)] border-[3px] border-black bg-united-gold px-4 py-2.5 font-caption font-bold uppercase leading-tight text-black shadow-[5px_5px_0_#000] ${c.pos === "tl" ? "left-[4%] top-[8%]" : "bottom-[9%] right-[4%]"}`}
              style={{ opacity: 0 }}
            >
              <div className="text-base sm:text-xl">{c.big}</div>
              {c.small ? <div className="mt-1 text-xs font-normal sm:text-sm">{c.small}</div> : null}
            </div>
          ))}

          {/* sound effect */}
          <div
            ref={sfxRef}
            className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 font-sfx text-5xl uppercase tracking-wide text-united-red opacity-0 sm:text-7xl"
            style={{ WebkitTextStroke: "3px #000", paintOrder: "stroke fill", textShadow: "5px 5px 0 #000" }}
            aria-hidden="true"
          >
            Whoooosh!
          </div>

          {/* title: a black comic banner across the middle */}
          <div ref={titleRef} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center opacity-0">
            <div className="-skew-y-3 border-y-[5px] border-white bg-black/90 px-6 py-4 shadow-[0_10px_0_#DA291C] sm:px-12 sm:py-6">
              <h1
                className="font-display text-[clamp(2.2rem,8.4vw,7.5rem)] uppercase leading-none tracking-wide text-white"
                style={{ textShadow: "5px 5px 0 #DA291C" }}
              >
                Manchester <span className="text-united-red" style={{ textShadow: "5px 5px 0 #fff" }}>United</span>
              </h1>
            </div>
            <div className="mt-8 rotate-1 border-[3px] border-black bg-united-gold px-5 py-2 font-caption text-lg font-bold uppercase text-black shadow-[5px_5px_0_#000] sm:text-2xl">
              The Theatre of Dreams
            </div>
          </div>

          {/* skip button */}
          <a
            href="#chapters"
            className="absolute right-3 top-3 border-[3px] border-black bg-white px-3 py-1 font-caption text-xs font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_#000] transition hover:bg-united-gold sm:text-sm"
          >
            Skip intro ▸
          </a>

          {/* scroll hint */}
          <div ref={hintRef} className="pointer-events-none absolute bottom-[5%] left-1/2 -translate-x-1/2">
            <div className="intro-bounce border-[3px] border-black bg-white px-4 py-1.5 font-caption text-sm font-bold uppercase tracking-widest text-black shadow-[4px_4px_0_#000]">
              Scroll ▼
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
