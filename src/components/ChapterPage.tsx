import Link from "next/link";

import { CHAPTERS, type Chapter } from "@/lib/chapters";
import { Horns } from "./DevilIcons";

/** The page every chapter uses until its real content is built: a comic header and a list of what is coming. */
export default function ChapterPage({ chapter }: { chapter: Chapter }) {
  const index = CHAPTERS.findIndex((c) => c.slug === chapter.slug);
  const next = CHAPTERS[(index + 1) % CHAPTERS.length];
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-5 pb-24 pt-28 text-center">
      <div className="mb-3 flex items-center gap-2 border-[3px] border-black bg-united-gold px-3 py-1 font-caption text-sm font-bold uppercase tracking-widest text-black shadow-[4px_4px_0_#000]">
        <Horns className="h-4 w-auto" /> Chapter {chapter.number}
      </div>
      <h1
        className="font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white"
        style={{ textShadow: "5px 5px 0 #DA291C" }}
      >
        {chapter.title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-white/75">{chapter.teaser}</p>

      <div className="mt-10 w-full -rotate-1 border-4 border-black bg-white p-6 text-left text-black shadow-[10px_10px_0_#DA291C] sm:p-8">
        <p className="font-sfx text-3xl uppercase tracking-wide text-united-red">Coming soon!</p>
        <p className="mt-2 font-caption text-base font-bold uppercase">What this chapter will have:</p>
        <ul className="mt-3 space-y-2 font-caption text-base">
          {chapter.planned.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 h-3 w-3 flex-none rotate-45 bg-united-red" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-4 font-caption text-sm font-bold uppercase">
        <Link href="/#chapters" className="border-[3px] border-white px-5 py-2 text-white transition hover:bg-white hover:text-black">
          ◂ All chapters
        </Link>
        <Link href={`/${next.slug}`} className="border-[3px] border-united-red bg-united-red px-5 py-2 text-white transition hover:bg-white hover:text-united-red">
          Next: {next.title} ▸
        </Link>
      </div>
    </main>
  );
}
