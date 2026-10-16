"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SLIDES } from "@/lib/slides";

/** Photos are plain files in public/photos, so on GitHub Pages they need the site's base path in front. */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SECONDS = 7;

/**
 * "Famous victories": one big photo at a time with its caption underneath (match, date, result, photo credit).
 *  - Arrow buttons, the keyboard's left/right keys, swiping on a phone, and dots to jump to a photo.
 *  - It moves on by itself every few seconds, but stops when you hover, focus or touch it, and never auto-plays
 *    for people whose device asks for reduced motion.
 */
export default function Slideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true); // assume yes until we know, so nothing moves by surprise
  const touchStart = useRef<number | null>(null);
  const count = SLIDES.length;

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = window.setTimeout(() => go(index + 1), SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, [index, paused, reduceMotion, go]);

  const autoplaying = !paused && !reduceMotion;
  const slide = SLIDES[index];

  return (
    <section id="victories" className="floodlight relative bg-black px-4 pb-16 pt-16 sm:px-6" aria-labelledby="victories-title">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Nights worth remembering</p>
        <h2 id="victories-title" className="mt-4 font-display text-[clamp(2rem,7vw,3.5rem)] uppercase leading-[0.95] text-white">
          Famous victories
        </h2>
        <div className="mx-auto mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
      </div>

      <div
        className="mx-auto mt-6 max-w-5xl"
        role="group"
        aria-roledescription="carousel"
        aria-label="Famous Manchester United victories"
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(index - 1);
          if (e.key === "ArrowRight") go(index + 1);
        }}
        onTouchStart={(e) => {
          setPaused(true);
          touchStart.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (start !== null) {
            const dx = e.changedTouches[0].clientX - start;
            if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          }
        }}
      >
        {/* the photos are stacked and cross-fade, so the next one is already loaded when it appears */}
        <div className="relative h-[min(62vh,75vw)] w-full overflow-hidden border border-white/15 bg-[#0c0c0c] sm:h-[min(60vh,640px)]">
          {SLIDES.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.file}
              src={`${BASE}/photos/${s.file}`}
              alt={s.alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              aria-hidden={i !== index}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
              style={{ objectPosition: s.focus ?? "50% 50%" }}
            />
          ))}
          {/* soft dark edges so the photo sits in the dark page */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.55)]" aria-hidden="true" />

          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/55 text-xl text-white backdrop-blur-sm transition hover:border-united-red hover:bg-united-red sm:left-4"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/40 bg-black/55 text-xl text-white backdrop-blur-sm transition hover:border-united-red hover:bg-united-red sm:right-4"
          >
            →
          </button>
          <div className="absolute right-3 top-3 bg-black/60 px-2.5 py-1 font-mono text-xs tracking-widest text-white/80 backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </div>
        </div>

        {/* the caption: match, date, result, then the photo credit */}
        <div className="mt-5 text-center" aria-live={autoplaying ? "off" : "polite"}>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-united-red">
            {slide.event} · {slide.date}
          </p>
          <p className="mt-3 font-display text-[clamp(1.5rem,4.5vw,2.6rem)] uppercase leading-tight tracking-wide text-white">{slide.headline}</p>
          {slide.detail ? <p className="mx-auto mt-2 max-w-2xl text-base text-white/75">{slide.detail}</p> : null}
          <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-white/50">
            Photo: “{slide.credit.title}” by {slide.credit.author},{" "}
            <a href={slide.credit.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              {slide.credit.licence}
            </a>
            , via Wikimedia Commons.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2" role="group" aria-label="Choose a photo">
          {SLIDES.map((s, i) => (
            <button
              key={s.file}
              type="button"
              onClick={() => go(i)}
              aria-label={`Photo ${i + 1} of ${count}`}
              aria-current={i === index}
              className="group flex h-6 w-6 items-center justify-center"
            >
              <span className={`block h-1.5 transition-all ${i === index ? "w-7 bg-united-red" : "w-1.5 bg-white/35 group-hover:bg-white/70"}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
