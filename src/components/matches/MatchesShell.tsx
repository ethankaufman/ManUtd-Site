import ChapterPage from "@/components/ChapterPage";
import { Horns } from "@/components/DevilIcons";
import MatchBrowser from "@/components/matches/MatchBrowser";
import { chapterBySlug } from "@/lib/chapters";
import { getMatchSeasons, getSeasonMatches } from "@/lib/data";
import { seasonLabel } from "@/lib/format";

/** The Every Match page for one season (shared by /matches and /matches/<season>). */
export default async function MatchesShell({ season }: { season: string }) {
  const chapter = chapterBySlug("matches");
  const [seasons, browse] = await Promise.all([getMatchSeasons(), getSeasonMatches(season)]);
  if (!browse) return <ChapterPage chapter={chapter} />;

  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Chapter {chapter.number}
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">Every Match</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 font-mono text-sm uppercase tracking-[0.3em] text-white/75">{seasonLabel(season)} · every competition</p>
      </div>
      <MatchBrowser key={season} browse={browse} seasons={seasons} />
    </main>
  );
}
