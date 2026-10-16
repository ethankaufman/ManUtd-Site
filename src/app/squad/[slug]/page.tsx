import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Horns } from "@/components/DevilIcons";
import PlayerView from "@/components/squad/PlayerView";
import { getPlayer, getPlayerSlugs } from "@/lib/data";

// The site is plain files, so every player page is made at build time for the players in the database.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPlayerSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/squad/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const player = await getPlayer(slug);
  return { title: player ? player.name : "Player" };
}

export default async function Page(props: PageProps<"/squad/[slug]">) {
  const { slug } = await props.params;
  const player = await getPlayer(slug);
  if (!player) notFound();

  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> {player.position}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6">
          <span className="font-display text-[clamp(3.5rem,14vw,8rem)] leading-none text-united-red">{player.number ?? "–"}</span>
          <h1 className="text-left font-display text-[clamp(2.2rem,8vw,5rem)] uppercase leading-[0.95] text-white">{player.name}</h1>
        </div>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
        <p className="mt-5 text-white/70">
          {[player.nationality, player.age ? `${player.age} years old` : null, player.heightCm ? `${player.heightCm} cm` : null].filter(Boolean).join(" · ")}
        </p>
      </div>
      <PlayerView player={player} />
      <p className="pb-16 text-center">
        <Link href="/squad" className="border border-white/30 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black">
          ← The whole squad
        </Link>
      </p>
    </main>
  );
}
