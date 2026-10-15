"use client";

import { useEffect, useRef } from "react";

import { Burst, City, FarCity, Surroundings } from "./city";
import { clamp, makeRng, ramp, smooth } from "./random";
import { INK, RED, STADIUM_HALF_HEIGHT, STADIUM_HALF_WIDTH, StadiumBase, StadiumDetails } from "./stadium";

/**
 * The opening of the site: a comic-book page that zooms from a bird's-eye view of Manchester right
 * down onto Old Trafford as you scroll.
 *
 * How it works (in plain words):
 *  - The page is five screens tall, but the comic panel is "sticky": it stays on screen while you scroll.
 *  - How far you have scrolled (0 to 1) decides how far the camera has zoomed.
 *  - Instead of re-drawing the page with React on every scroll step (slow), we move the drawing
 *    directly with a small animation loop. That keeps it smooth.
 *  - Add ?p=0.5 to the address to freeze the intro at 50% (handy for screenshots).
 */

const CAPTIONS = [
  { from: -0.05, to: 0.27, pos: "tl", big: "Manchester, England.", small: "Red brick. Rain. And one unmistakable roar." },
  { from: 0.27, to: 0.53, pos: "br", big: "Sir Matt Busby Way, Stretford.", small: "" },
  { from: 0.53, to: 0.8, pos: "tl", big: "Old Trafford. Opened 1910.", small: "Over 74,000 seats." },
] as const;

const MAX_ROTATION = -14; // degrees the camera is twisted at the start; it untwists as it zooms

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

export default function Intro() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const farRef = useRef<SVGGElement>(null);
  const cityRef = useRef<SVGGElement>(null);
  const burstRef = useRef<SVGGElement>(null);
  const detailRef = useRef<SVGGElement>(null);
  const speedRef = useRef<SVGSVGElement>(null);
  const sfxRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    const params = new URLSearchParams(window.location.search);
    const frozen = params.get("p") !== null ? clamp(parseFloat(params.get("p") ?? "0") || 0) : null;
    const previewSpeed = parseFloat(params.get("v") ?? "0") || 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (frozen !== null || reduceMotion) wrap.style.height = "100vh";

    // the halftone dots and hatching are patterns; we keep their size the same on screen as the camera zooms
    const dots = ["dotsDark", "dotsRed"].map((id) => {
      const pattern = stage.querySelector<SVGPatternElement>(`#${id}`);
      return { pattern, circle: pattern?.querySelector("circle") ?? null };
    });
    const hatch = stage.querySelector<SVGPatternElement>("#hatch");
    const hatchLine = hatch?.querySelector("line") ?? null;

    let target = frozen ?? (reduceMotion ? 1 : 0);
    let current = target;
    let shown = -1;
    let speed = previewSpeed;
    let raf = 0;

    function render(p: number, speedNow: number) {
      const box = stage!.getBoundingClientRect();
      const w = box.width;
      const h = box.height;
      if (!w || !h) return;

      // how big one drawing unit is on screen: from "all of Manchester" to "the whole stadium fills the panel"
      const fStart = Math.max(w / 2800, h / 1800);
      const fEnd = Math.max(fStart * 3, Math.min((0.86 * w) / (STADIUM_HALF_WIDTH * 2 + 30), (0.86 * h) / (STADIUM_HALF_HEIGHT * 2 + 30)));
      const e = 0.55 * p + 0.45 * smooth(p);
      const f = fStart * Math.pow(fEnd / fStart, e);
      const z = f / fStart;
      const rot = MAX_ROTATION * (1 - e);
      worldRef.current?.setAttribute("transform", `translate(${w / 2} ${h / 2}) rotate(${rot.toFixed(2)}) scale(${f.toFixed(4)})`);

      const setOpacity = (el: Element | null, o: number) => el && ((el as HTMLElement | SVGElement).style.opacity = o.toFixed(3));
      setOpacity(farRef.current, 1 - ramp(z, 1.8, 3.4));
      setOpacity(cityRef.current, 1 - 0.85 * ramp(z, 2.4, 4.4));
      setOpacity(burstRef.current, 1 - ramp(z, 1.6, 2.8));
      setOpacity(detailRef.current, ramp(z, 1.9, 3.6));

      // keep dot size and line thickness constant on screen (about 6 px apart)
      const period = 6 / f;
      for (const d of dots) {
        d.pattern?.setAttribute("width", period.toFixed(4));
        d.pattern?.setAttribute("height", period.toFixed(4));
        d.circle?.setAttribute("cx", (period / 2).toFixed(4));
        d.circle?.setAttribute("cy", (period / 2).toFixed(4));
        d.circle?.setAttribute("r", (period * 0.3).toFixed(4));
      }
      hatch?.setAttribute("width", period.toFixed(4));
      hatch?.setAttribute("height", period.toFixed(4));
      hatchLine?.setAttribute("y2", period.toFixed(4));
      hatchLine?.setAttribute("stroke-width", (1.1 / f).toFixed(4));

      // caption boxes fade in and out
      CAPTIONS.forEach((c, i) => {
        const el = capRefs.current[i];
        if (!el) return;
        const o = ramp(p, c.from, c.from + 0.04) * (1 - ramp(p, c.to - 0.04, c.to));
        el.style.opacity = o.toFixed(3);
        el.style.transform = `rotate(${c.pos === "tl" ? -1.4 : 1.2}deg) translateY(${((1 - o) * 14).toFixed(1)}px)`;
      });

      // title at the end
      const t = ramp(p, 0.84, 0.94);
      if (titleRef.current) {
        titleRef.current.style.opacity = t.toFixed(3);
        titleRef.current.style.transform = `scale(${(1.3 - 0.3 * t).toFixed(3)})`;
      }

      // speed lines and the WHOOSH, only while the camera is moving fast
      const fast = clamp((speedNow - 0.0015) * 70);
      if (speedRef.current) speedRef.current.style.opacity = (fast * 0.9).toFixed(3);
      if (sfxRef.current) {
        sfxRef.current.style.opacity = clamp(fast * 1.4 - 0.2).toFixed(3);
        sfxRef.current.style.transform = `rotate(-7deg) scale(${(0.9 + fast * 0.35).toFixed(3)})`;
      }
      if (hintRef.current) hintRef.current.style.opacity = (1 - ramp(p, 0.01, 0.06)).toFixed(3);
    }

    function tick() {
      raf = 0;
      const previous = current;
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0004) current = target;
      speed = frozen !== null ? previewSpeed : speed * 0.8 + Math.abs(current - previous) * 0.2;
      if (current !== shown || speed > 0.0001) {
        shown = current;
        render(current, speed);
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

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={wrapRef} style={{ height: "520vh" }} aria-label="Introduction: a zoom from Manchester down to Old Trafford">
      <div className="sticky top-0 h-screen w-full bg-white p-2 sm:p-3">
        <div ref={stageRef} className="relative h-full w-full overflow-hidden border-[5px] border-black bg-white">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <pattern id="dotsDark" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <circle cx="3" cy="3" r="1.8" fill={INK} />
              </pattern>
              <pattern id="dotsRed" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <circle cx="3" cy="3" r="1.8" fill={RED} />
              </pattern>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke={INK} strokeWidth="1" />
              </pattern>
              <pattern id="farCity" width="26" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
                <rect x="2" y="2" width="22" height="14" fill="#fff" stroke={INK} strokeWidth="1.3" />
                <path d="M2,9 H24" stroke={INK} strokeWidth="0.8" />
              </pattern>
              <pattern id="cars" width="16" height="12" patternUnits="userSpaceOnUse">
                <rect x="1.2" y="1.2" width="5.6" height="3" rx="0.8" fill="#fff" stroke={INK} strokeWidth="0.5" />
                <rect x="9.2" y="1.2" width="5.6" height="3" rx="0.8" fill={INK} />
                <rect x="1.2" y="7.2" width="5.6" height="3" rx="0.8" fill={INK} />
                <rect x="9.2" y="7.2" width="5.6" height="3" rx="0.8" fill={RED} stroke={INK} strokeWidth="0.5" />
              </pattern>
            </defs>
            <g ref={worldRef}>
              <g ref={farRef}><FarCity /></g>
              <g ref={burstRef}><Burst /></g>
              <g ref={cityRef}><City /></g>
              <Surroundings />
              <StadiumBase />
              <g ref={detailRef}><StadiumDetails /></g>
            </g>
          </svg>

          {/* speed lines */}
          <svg ref={speedRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" viewBox="-100 -100 200 200" preserveAspectRatio="none" aria-hidden="true">
            {SPEED_LINES.map((pts, i) => (
              <polygon key={i} points={pts} fill={INK} />
            ))}
          </svg>

          {/* comic caption boxes */}
          {CAPTIONS.map((c, i) => (
            <div
              key={c.big}
              ref={(el) => {
                capRefs.current[i] = el;
              }}
              className={`pointer-events-none absolute max-w-[min(22rem,80%)] border-[3px] border-black bg-united-gold px-4 py-2.5 font-[family-name:var(--font-comic)] font-bold uppercase leading-tight text-black shadow-[5px_5px_0_#000] ${c.pos === "tl" ? "left-[4%] top-[6%]" : "bottom-[9%] right-[4%]"}`}
              style={{ opacity: 0 }}
            >
              <div className="text-base sm:text-xl">{c.big}</div>
              {c.small ? <div className="mt-1 text-xs font-normal sm:text-sm">{c.small}</div> : null}
            </div>
          ))}

          {/* sound effect */}
          <div
            ref={sfxRef}
            className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 font-[family-name:var(--font-bangers)] text-5xl uppercase tracking-wide text-united-red opacity-0 sm:text-7xl"
            style={{ WebkitTextStroke: "3px #000", paintOrder: "stroke fill", textShadow: "5px 5px 0 #000" }}
            aria-hidden="true"
          >
            Whoooosh!
          </div>

          {/* title: a black comic banner across the middle, so the stadium stays visible above and below */}
          <div ref={titleRef} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center opacity-0">
            <div className="-skew-y-3 border-y-[5px] border-white bg-black px-6 py-4 shadow-[0_10px_0_#DA291C] sm:px-12 sm:py-6">
              <h1
                className="font-[family-name:var(--font-anton)] text-[clamp(2.2rem,8.4vw,7.5rem)] uppercase leading-none tracking-wide text-white"
                style={{ textShadow: "5px 5px 0 #DA291C" }}
              >
                Manchester <span className="text-united-red" style={{ textShadow: "5px 5px 0 #fff" }}>United</span>
              </h1>
            </div>
            <div className="mt-8 rotate-1 border-[3px] border-black bg-united-gold px-5 py-2 font-[family-name:var(--font-comic)] text-lg font-bold uppercase text-black shadow-[5px_5px_0_#000] sm:text-2xl">
              The Theatre of Dreams
            </div>
          </div>

          {/* scroll hint */}
          <div ref={hintRef} className="pointer-events-none absolute bottom-[5%] left-1/2 -translate-x-1/2">
            <div className="intro-bounce border-[3px] border-black bg-white px-4 py-1.5 font-[family-name:var(--font-comic)] text-sm font-bold uppercase tracking-widest text-black shadow-[4px_4px_0_#000]">
              Scroll ▼
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
