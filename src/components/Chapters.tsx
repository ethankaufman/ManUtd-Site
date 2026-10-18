import Link from "next/link";

import { CHAPTERS } from "@/lib/chapters";
import { Horns, PitchforkDivider } from "./DevilIcons";

/** The home page's list of chapters: a column of wide, flat rows down the middle of the page. */
export default function Chapters() {
  return (
    <section id="chapters" className="floodlight relative overflow-hidden bg-[#050505] px-5 pb-28 pt-24">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> The Red Devils
        </div>
        <h2 className="mt-5 font-display text-[clamp(2.4rem,9vw,5.5rem)] uppercase leading-[0.95] text-white">Choose your chapter</h2>
        <p className="mt-4 max-w-xl text-lg text-white/70">Everything about Manchester United, one chapter at a time.</p>
        <PitchforkDivider className="mt-10 w-full" />
      </div>

      <ol className="relative mx-auto mt-12 flex max-w-3xl flex-col gap-4">
        {CHAPTERS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/${c.slug}`}
              className={`glow-red group relative block border p-6 text-left transition duration-200 hover:-translate-y-0.5 sm:p-8 ${
                c.featured ? "border-united-red bg-united-red/10" : "border-white/15 bg-[#0c0c0c] hover:border-united-red"
              }`}
            >
              <div className="flex items-start gap-5 sm:gap-7">
                <span className="font-mono text-sm tracking-widest text-united-red sm:pt-2" aria-hidden="true">
                  {c.number}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-3xl uppercase leading-none tracking-wide text-white sm:text-4xl">{c.title}</h3>
                  <p className="mt-3 text-base leading-snug text-white/70 sm:text-lg">{c.teaser}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-widest">
                    {c.status === "soon" ? <span className="border border-white/25 px-2 py-0.5 text-white/60">Coming soon</span> : null}
                    <span className="text-white transition group-hover:translate-x-1 group-hover:text-united-red">Open chapter →</span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <div className="relative mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest">
        <span className="text-white/50">And also</span>
        <Link href="/on-this-day/" className="text-white transition hover:text-united-red">
          On this day →
        </Link>
        <Link href="/head-to-head/" className="text-white transition hover:text-united-red">
          Head to head →
        </Link>
      </div>
    </section>
  );
}
