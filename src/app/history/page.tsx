import type { Metadata } from "next";

import { Horns } from "@/components/DevilIcons";
import HistoryTabs from "@/components/history/HistoryTabs";
import { chapterBySlug } from "@/lib/chapters";
import { SEASONS } from "@/lib/club";

export const metadata: Metadata = { title: "The History" };

export default function Page() {
  const chapter = chapterBySlug("history");
  const first = SEASONS[0].season.slice(0, 4);
  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Chapter {chapter.number}
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">The History</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 font-mono text-sm uppercase tracking-[0.3em] text-white/75">Since 1878 · {SEASONS.length} seasons on record from {first}</p>
      </div>
      <HistoryTabs />
    </main>
  );
}
