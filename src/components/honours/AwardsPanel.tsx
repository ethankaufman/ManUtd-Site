import { AWARDS, BALLON_DOR, inPeriod } from "@/lib/honours";

type Row = { season: string; winner: string; detail: string };
type Group = { label: string; rows: Row[]; note?: string };

/** The Premier League-era awards, grouped by award, plus the Ballon d'Or. Each group is a collapsed row. */
export default function AwardsPanel({ since1992 }: { since1992: boolean }) {
  const groups: Group[] = [];
  const ballon = BALLON_DOR.filter((b) => !since1992 || b.year >= 1993).map((b) => ({ season: String(b.year), winner: b.player, detail: "" }));
  if (ballon.length) groups.push({ label: "Ballon d’Or", rows: ballon.reverse(), note: "Awarded to the best player in the world each year. Law, Charlton and Best won it with United in the 1960s, Cristiano Ronaldo in 2008." });

  // players first, then managers, then the statistical awards
  const order = ["player_of_the_season", "pfa_players_player", "fwa_footballer", "pfa_young_player", "young_player_of_the_season", "manager_of_the_season", "lma_manager_of_the_year", "golden_boot", "golden_glove", "top_assists", "playmaker_of_the_season", "goal_of_the_season"];
  const keys = [...order, ...Array.from(new Set(AWARDS.map((a) => a.award))).filter((k) => !order.includes(k))];
  for (const key of keys) {
    const mine = AWARDS.filter((a) => a.award === key && inPeriod(a.season, since1992));
    if (!mine.length) continue;
    const rows = mine.map((a) => ({ season: a.season.replace("-", "–"), winner: a.winner, detail: a.detail }));
    groups.push({ label: mine[0].label, rows: rows.reverse() });
  }
  const total = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-white/60">
        {total} individual awards won by United players and managers{since1992 ? " since 1992" : ""}. Open an award to see who won it and when.
        {!since1992 ? " Apart from the Ballon d’Or, these awards are from the Premier League era (1992 onward); earlier individual awards are not covered yet." : ""}
      </p>
      <div className="border-y border-white/15">
        {groups.map((g) => (
          <details key={g.label} className="group border-b border-white/10 last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center gap-4 py-3 pr-1 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1 font-display text-lg uppercase tracking-wide text-white sm:text-xl">{g.label}</span>
              <span className="flex-none font-display text-2xl text-united-gold">{g.rows.length}</span>
              <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
                ›
              </span>
            </summary>
            <div className="border-t border-white/10 bg-white/[0.02] px-3 py-4 sm:px-5">
              {g.note ? <p className="mb-3 text-xs leading-relaxed text-white/55">{g.note}</p> : null}
              <ul className="divide-y divide-white/5">
                {g.rows.map((r) => (
                  <li key={r.season + r.winner} className="flex flex-wrap gap-x-4 py-1.5 text-sm text-white/85">
                    <span className="w-20 flex-none font-mono text-xs text-united-gold">{r.season}</span>
                    <span className="font-bold text-white">{r.winner}</span>
                    {r.detail ? <span className="text-white/55">{r.detail}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        Source: the Premier League’s award lists as collected for the PL History Dashboard (checked against several sources there), and Wikipedia’s list of Ballon d’Or winners.
        Awards are listed for the club the player or manager was at when he won.
      </p>
    </div>
  );
}
