import type { Metadata } from "next";

import { Horns } from "@/components/DevilIcons";
import ChapterPage from "@/components/ChapterPage";
import SeasonHub from "@/components/season/SeasonHub";
import { chapterBySlug } from "@/lib/chapters";
import { getSeasonHub } from "@/lib/data";

export const metadata: Metadata = { title: "This Season" };

export default async function Page() {
  const chapter = chapterBySlug("season");
  const hub = await getSeasonHub();
  if (!hub) return <ChapterPage chapter={chapter} />;

  const [from, to] = hub.season.split("-");
  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-12">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Chapter {chapter.number}
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">This Season</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 font-mono text-sm uppercase tracking-[0.3em] text-white/75">
          {from}–{to} · every competition
        </p>
      </div>
      <SeasonHub hub={hub} />
    </main>
  );
}
