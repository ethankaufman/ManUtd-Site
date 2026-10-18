import { dayLabel } from "@/lib/format";
import type { PlayerPage, Tally } from "@/lib/season";

const CHIP = { W: "bg-united-red text-white", D: "bg-white/15 text-white", L: "border border-white/30 text-white/70" } as const;
const SHORT: Record<string, string> = {
  "premier-league": "PL",
  "champions-league": "UCL",
  "europa-league": "UEL",
  "conference-league": "UECL",
  "carabao-cup": "League Cup",
  "fa-cup": "FA Cup",
  "community-shield": "Shield",
  friendlies: "Friendly",
};

function Box({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/15 bg-[#0c0c0c] px-3 py-4 text-center">
      <div className="font-display text-4xl leading-none text-white">{value}</div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-white/55">{label}</div>
    </div>
  );
}

function Heading({ children }: { children: string }) {
  return <h2 className="mb-4 text-center font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">{children}</h2>;
}

function did(l: PlayerPage["log"][number]): string {
  const bits: string[] = [];
  if (l.goals) bits.push(`${l.goals} goal${l.goals > 1 ? "s" : ""}`);
  if (l.assists) bits.push(`${l.assists} assist${l.assists > 1 ? "s" : ""}`);
  if (l.yellow) bits.push("yellow card");
  if (l.red) bits.push("red card");
  return bits.join(" · ");
}

/** A player's season: totals, a line per competition, and every match they played in. */
export default function PlayerView({ player }: { player: PlayerPage }) {
  const t: Tally = player.totals;
  const firstYear = parseInt(player.season, 10);
  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 px-4 pb-14 text-left">
      <section aria-label="Season totals">
        <Heading>{`${player.season.replace("-", "–")} season`}</Heading>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <Box label="Apps" value={t.apps} />
          <Box label="Starts" value={t.starts} />
          <Box label="Goals" value={t.goals} />
          <Box label="Assists" value={t.assists} />
          <Box label="Yellows" value={t.yellow} />
          <Box label="Reds" value={t.red} />
        </div>
        <p className="mt-3 text-center text-xs text-white/45">All competitions so far, not counting pre-season friendlies.</p>
      </section>

      {player.byCompetition.length ? (
        <section aria-label="By competition">
          <Heading>By competition</Heading>
          <div className="overflow-x-auto border border-white/15 bg-[#0c0c0c]">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <thead className="font-mono text-[11px] uppercase tracking-widest text-white/55">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-normal">Competition</th>
                  {["Apps", "Starts", "Goals", "Assists", "YC", "RC"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-right font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {player.byCompetition.map((c) => (
                  <tr key={c.slug} className="border-t border-white/10 text-white/85">
                    <td className="px-3 py-2">{c.name}</td>
                    {[c.tally.apps, c.tally.starts, c.tally.goals, c.tally.assists, c.tally.yellow, c.tally.red].map((n, i) => (
                      <td key={i} className="px-3 py-2 text-right tabular-nums">{n}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="text-center text-white/65">No appearances recorded this season yet.</p>
      )}

      {player.log.length ? (
        <section aria-label="Matches played">
          <Heading>Matches played</Heading>
          <ul>
            {player.log.map((l) => (
              <li key={l.matchId} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/10 py-3 last:border-b-0">
                <span className="w-24 flex-none font-mono text-[11px] uppercase tracking-widest text-white/55">
                  {dayLabel(l.kickoff, new Date(l.kickoff).getUTCFullYear() !== firstYear)}
                </span>
                <span className="flex-none border border-white/20 px-1.5 py-px font-mono text-[11px] uppercase tracking-widest text-white/70">
                  {SHORT[l.competition] ?? l.competition}
                </span>
                <span className="min-w-0 flex-1 text-white/85">
                  {l.home ? "v" : "at"} {l.opponent}{" "}
                  <span className="font-display tracking-wide text-white">
                    {l.goalsFor} – {l.goalsAgainst}
                  </span>
                </span>
                <span className="text-xs text-white/55">
                  {l.started ? (l.subbedOff ? "Started, subbed off" : "Started") : "Came on as a substitute"}
                  {did(l) ? ` · ${did(l)}` : ""}
                </span>
                {l.result ? <span className={`flex h-6 w-6 flex-none items-center justify-center font-mono text-xs font-bold ${CHIP[l.result]}`}>{l.result}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
