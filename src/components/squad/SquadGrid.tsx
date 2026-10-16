import Link from "next/link";

import { POSITION_ORDER, type SquadPlayer } from "@/lib/season";

const GROUP_TITLE: Record<string, string> = {
  Goalkeeper: "Goalkeepers",
  Defender: "Defenders",
  Midfielder: "Midfielders",
  Forward: "Forwards",
};

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
                    <span className="w-14 flex-none text-center font-display text-4xl leading-none text-united-red" aria-hidden="true">
                      {p.number ?? "–"}
                    </span>
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
        Positions are as listed by the data provider.
      </p>
    </div>
  );
}
