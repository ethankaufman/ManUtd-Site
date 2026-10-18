import type { Metadata } from "next";

import { Horns } from "@/components/DevilIcons";
import HeadToHead from "@/components/h2h/HeadToHead";

export const metadata: Metadata = { title: "Head to Head" };

export default function Page() {
  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Settle the argument
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,10vw,6rem)] uppercase leading-[0.95] text-white">Head to Head</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 max-w-xl text-lg text-white/70">Pick any club United have played since 1992–93 and see the record, the biggest results and every meeting.</p>
      </div>
      <HeadToHead />
    </main>
  );
}
