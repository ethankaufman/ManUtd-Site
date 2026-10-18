import { dayLabel, surname } from "@/lib/format";
import { UNITED, unitedResult, unitedView, type FullMatch, type Lineup } from "@/lib/season";

const CHIP = {
  W: "bg-united-red text-white",
  D: "bg-white/15 text-white",
  L: "border border-white/30 text-white/70",
} as const;

function Label({ children }: { children: string }) {
  return <h4 className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-united-red">{children}</h4>;
}

function goalSuffix(kind: string, assist: string | null | undefined) {
  if (kind === "Own goal") return " (own goal)";
  if (kind === "Penalty") return " (pen)";
  return assist ? ` (${surname(assist)})` : "";
}

function LineupColumn({ lu }: { lu: Lineup }) {
  const starters = lu.players.filter((p) => p.start);
  const subs = lu.players.filter((p) => !p.start && p.on);
  return (
    <div>
      <p className="mb-1 text-sm font-bold text-white">
        {lu.team}
        {lu.formation ? <span className="ml-2 font-mono text-xs font-normal text-white/50">{lu.formation}</span> : null}
      </p>
      <ol className="space-y-0.5 text-sm text-white/80">
        {starters.map((p) => (
          <li key={`${p.name}-${p.no}`} className="flex gap-2">
            <span className="w-6 flex-none text-right font-mono text-xs text-white/45">{p.no ?? ""}</span>
            <span>
              {p.name}
              {p.off ? <span className="ml-1 text-white/40">↓</span> : null}
            </span>
          </li>
        ))}
      </ol>
      {subs.length ? (
        <>
          <p className="mb-0.5 mt-2 font-mono text-[10px] uppercase tracking-widest text-white/45">Came on</p>
          <ul className="space-y-0.5 text-sm text-white/70">
            {subs.map((p) => (
              <li key={`${p.name}-${p.no}`} className="flex gap-2">
                <span className="w-6 flex-none text-right font-mono text-xs text-white/45">{p.no ?? ""}</span>
                <span>
                  {p.name} <span className="text-white/40">↑</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** One match as a native expanding row (<details>): the summary line is always visible, the full story opens on click. */
export default function MatchItem({ m, competition }: { m: FullMatch; competition: string }) {
  const res = unitedResult(m);
  const v = unitedView(m);
  const finished = m.state === "finished";
  const homeIsUnited = m.home === UNITED;
  const pens = v.pensFor !== null && v.pensAgainst !== null ? `${v.pensFor}–${v.pensAgainst} on penalties` : null;
  const unitedLineup = m.lineups.find((l) => l.team === UNITED);
  const otherLineup = m.lineups.find((l) => l.team !== UNITED);

  return (
    <li className="border-b border-white/10 last:border-b-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1.5 py-3 pr-1 hover:bg-white/[0.03] sm:flex-nowrap [&::-webkit-details-marker]:hidden">
          <span className="flex-1 font-mono text-[11px] uppercase tracking-wider text-white/55 sm:w-28 sm:flex-none">{dayLabel(m.kickoff, true)}</span>
          <span className="order-2 flex flex-none items-center gap-3 sm:order-3">
            {res ? <span className={`flex h-6 w-6 flex-none items-center justify-center font-mono text-xs font-bold ${CHIP[res]}`}>{res}</span> : <span className="w-6 flex-none" />}
            <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
              ›
            </span>
          </span>
          <span className="order-3 grid basis-full grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm sm:order-2 sm:basis-0 sm:flex-1 sm:gap-3 sm:text-base">
            <span className={`break-words text-right ${homeIsUnited ? "font-bold text-white" : "text-white/75"}`}>{m.home}</span>
            <span className="min-w-[3.5rem] text-center font-display text-lg tracking-wide text-white">{finished ? `${m.homeGoals} – ${m.awayGoals}` : "v"}</span>
            <span className={`break-words ${homeIsUnited ? "text-white/75" : "font-bold text-white"}`}>{m.away}</span>
          </span>
        </summary>

        <div className="space-y-5 border-t border-white/10 bg-white/[0.02] px-3 py-5 text-left sm:px-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/55">
            {competition}
            {m.round ? <span className="normal-case tracking-normal"> · {m.round}</span> : null}
            {m.venue ? <span className="normal-case tracking-normal"> · {[m.venue, m.city].filter(Boolean).join(", ")}</span> : null}
            {m.attendance ? <span className="normal-case tracking-normal"> · Attendance {m.attendance.toLocaleString("en-GB")}</span> : null}
          </p>
          {pens || m.note ? <p className="text-sm text-white/80">{pens ? `${(v.pensFor ?? 0) > (v.pensAgainst ?? 0) ? "Won" : "Lost"} ${pens}` : m.note}</p> : null}

          {m.goals.length ? (
            <div>
              <Label>Goals</Label>
              <ul className="space-y-1 text-sm text-white/85">
                {m.goals.map((g, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-10 flex-none text-right font-mono text-xs text-white/50">{g.min}&apos;</span>
                    <span>
                      <span className={g.team === UNITED ? "font-bold text-white" : ""}>{g.player ?? "Unknown"}</span>
                      <span className="text-white/55">{goalSuffix(g.kind, g.assist)}</span>
                      {g.team && g.team !== UNITED ? <span className="text-white/45"> · {g.team}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : finished ? (
            <p className="text-sm text-white/60">{(m.homeGoals ?? 0) + (m.awayGoals ?? 0) === 0 ? "No goals." : "Scorers were not recorded for this match."}</p>
          ) : null}

          {m.cards.length ? (
            <div>
              <Label>Cards</Label>
              <ul className="space-y-1 text-sm text-white/80">
                {m.cards.map((c, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-10 flex-none text-right font-mono text-xs text-white/50">{c.min}&apos;</span>
                    <span>
                      {c.player ?? "Unknown"} <span className="text-white/55">· {c.kind}</span>
                      {c.team ? <span className="text-white/45"> · {c.team}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {unitedLineup || otherLineup ? (
            <div>
              <Label>Line-ups</Label>
              <div className="grid gap-6 sm:grid-cols-2">
                {unitedLineup ? <LineupColumn lu={unitedLineup} /> : null}
                {otherLineup ? <LineupColumn lu={otherLineup} /> : null}
              </div>
            </div>
          ) : null}

          {m.incomplete ? (
            <p className="border-l-2 border-united-red pl-3 text-xs leading-relaxed text-white/55">
              {m.source === "wikipedia"
                ? "For this match the source lists United’s scorers only (surnames), with no line-ups or cards."
                : "The source has only part of the detail for this match."}
            </p>
          ) : null}
        </div>
      </details>
    </li>
  );
}
