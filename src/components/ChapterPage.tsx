import Link from "next/link";

import { CHAPTERS, type Chapter } from "@/lib/chapters";
import { Horns } from "./DevilIcons";

/** The page every chapter uses until its real content is built: a header and a list of what is coming. */
export default function ChapterPage({ chapter }: { chapter: Chapter }) {
  const index = CHAPTERS.findIndex((c) => c.slug === chapter.slug);
  const next = CHAPTERS[(index + 1) % CHAPTERS.length];
  return (
    <main className="floodlight mx-auto flex min-h-screen w-full flex-col items-center px-5 pb-24 pt-28 text-center">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
        <Horns className="h-3.5 w-auto" /> Chapter {chapter.number}
      </div>
      <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">{chapter.title}</h1>
      <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
      <p className="mt-5 max-w-xl text-lg text-white/70">{chapter.teaser}</p>

      <div className="mt-10 w-full max-w-3xl border border-white/15 bg-[#0c0c0c] p-6 text-left sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-united-red">Coming soon</p>
        <p className="mt-2 font-display text-2xl uppercase tracking-wide text-white">What this chapter will have</p>
        <ul className="mt-4 space-y-2 text-base text-white/80">
          {chapter.planned.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-none bg-united-red" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3 font-mono text-xs uppercase tracking-widest">
        <Link href="/#chapters" className="border border-white/30 px-5 py-2.5 text-white transition hover:border-white hover:bg-white hover:text-black">
          ← All chapters
        </Link>
        <Link href={`/${next.slug}`} className="border border-united-red bg-united-red px-5 py-2.5 text-white transition hover:bg-white hover:text-united-red">
          Next: {next.title} →
        </Link>
      </div>
    </main>
  );
}
