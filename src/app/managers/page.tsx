import type { Metadata } from "next";

import { Horns } from "@/components/DevilIcons";
import ManagersView from "@/components/managers/ManagersView";
import { chapterBySlug } from "@/lib/chapters";
import { getRecordSince } from "@/lib/data";
import { MANAGERS } from "@/lib/managers";

export const metadata: Metadata = { title: "The Managers" };

export default async function Page() {
  const chapter = chapterBySlug("managers");
  // whoever is in charge now: their record is worked out from the match database, so it stays current
  const current = MANAGERS.find((m) => m.current);
  const live = current ? await getRecordSince(current.stints.find((s) => s.live)!.from) : null;
  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Chapter {chapter.number}
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">The Managers</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 font-mono text-sm uppercase tracking-[0.3em] text-white/75">Every manager, caretaker and interim since 1889</p>
      </div>
      <ManagersView live={live} />
    </main>
  );
}
