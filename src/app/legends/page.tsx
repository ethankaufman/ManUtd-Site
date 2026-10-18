import type { Metadata } from "next";

import { Horns } from "@/components/DevilIcons";
import LegendCard from "@/components/legends/LegendCard";
import { chapterBySlug } from "@/lib/chapters";
import { ERAS, LEGENDS } from "@/lib/legends";

export const metadata: Metadata = { title: "The Legends" };

export default function Page() {
  const chapter = chapterBySlug("legends");
  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-12">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Chapter {chapter.number}
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">The Legends</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 max-w-xl text-lg text-white/70">{chapter.teaser}</p>
      </div>
      <div className="mx-auto w-full max-w-6xl space-y-12 px-4 pb-24 text-left">
        {ERAS.map((era) => {
          const list = LEGENDS.filter(era.test);
          if (!list.length) return null;
          return (
            <section key={era.title} aria-label={era.title}>
              <h2 className="mb-4 flex items-baseline gap-3 font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">
                {era.title}
                <span className="font-mono text-xs tracking-widest text-white/40">{list.length}</span>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((l) => (
                  <LegendCard key={l.slug} l={l} />
                ))}
              </ul>
            </section>
          );
        })}
        <p className="text-center text-xs leading-relaxed text-white/40">
          Twenty of the club’s greats, chosen to cover every era; more can be added. Appearances and goals are in all competitions. Portraits are free-licensed pictures from Wikimedia Commons: for the
          older legends the only free pictures are later portraits or statues, and each page says what its photo shows.
        </p>
      </div>
    </main>
  );
}
