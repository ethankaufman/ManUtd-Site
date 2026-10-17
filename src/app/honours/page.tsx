import type { Metadata } from "next";

import { Horns } from "@/components/DevilIcons";
import HonoursView from "@/components/honours/HonoursView";
import { chapterBySlug } from "@/lib/chapters";

export const metadata: Metadata = { title: "Honours & Awards" };

export default function Page() {
  const chapter = chapterBySlug("honours");
  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Chapter {chapter.number}
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">Honours &amp; Awards</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 font-mono text-sm uppercase tracking-[0.3em] text-white/75">The trophy cabinet · all time and since 1992</p>
      </div>
      <HonoursView />
    </main>
  );
}
