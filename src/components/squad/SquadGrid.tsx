import Link from "next/link";

import { playerPhoto } from "@/lib/player-photos";
import { POSITION_ORDER, type SquadPlayer } from "@/lib/season";

const GROUP_TITLE: Record<string, string> = {
  Goalkeeper: "Goalkeepers",
  Defender: "Defenders",
  Midfielder: "Midfielders",
  Forward: "Forwards",
};

/** A small portrait with the shirt number on it; without a photo, just the big number. */
function Portrait({ player }: { player: SquadPlayer }) {
  const photo = playerPhoto(player.slug);
  if (!photo) {
    return (
      <span className="flex h-24 w-[4.5rem] flex-none items-center justify-center border border-white/10 bg-black font-display text-4xl leading-none text-united-red" aria-hidden="true">
        {player.number ?? "–"}
      </span>
    );
  }
  return (
    <span className="relative block h-24 w-[4.5rem] flex-none overflow-hidden border border-white/10 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt={`${player.name}`} loading="lazy" className="h-full w-full object-cover object-top" />
      <span className="absolute bottom-0 left-0 bg-united-red px-1.5 py-0.5 font-display text-lg leading-none text-white" aria-hidden="true">
        {player.number ?? "–"}
      </span>
    </span>
  );
}

/** The squad, grouped by position. Each player is a link to their own page. */
export default function SquadGrid({ players }: { players: SquadPlayer[] }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 pb-20 text-left">
      {POSITION_ORDER.map((pos) => {
        const group = players.filter((p) => p.position === pos);
        if (!group.length) return null;
        return (
          <section key={pos} aria-label={GROUP_TITLE[pos]}>
            <h2 className="mb-4 flex items-baseline gap-3 font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">
              {GROUP_TITLE[pos]}
              <span className="font-mono text-xs tracking-widest text-white/40">{group.length}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/squad/${p.slug}`}
                    className="glow-red group flex h-full items-center gap-4 border border-white/15 bg-[#0c0c0c] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-united-red"
                  >
                    <Portrait player={p} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-xl uppercase tracking-wide text-white">{p.name}</span>
                      <span className="mt-0.5 block truncate text-sm text-white/60">
                        {[p.nationality, p.age ? `${p.age} years` : null].filter(Boolean).join(" · ")}
                      </span>
                      <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-widest text-white/45">
                        {p.totals.apps} apps · {p.totals.goals} goals · {p.totals.assists} assists
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="text-center text-xs leading-relaxed text-white/40">
        Appearances, goals and assists are for this season in every competition, not counting pre-season friendlies.
        Positions are as listed by the data provider. Photos are free-licensed pictures from Wikimedia Commons and may show a player
        with a previous club or country; each player&apos;s page credits the photographer.
      </p>
    </div>
  );
}
