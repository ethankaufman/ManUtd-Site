import { unitedResult, unitedView, UNITED, type HubMatch } from "@/lib/data";
import { dayLabel, surname, timeLabel } from "@/lib/format";

const CHIP = {
  W: "bg-united-red text-white",
  D: "bg-white/15 text-white",
  L: "border border-white/30 text-white/70",
} as const;

/** "Fernandes 40' (Cunha)", "Mbeumo 73' (pen)", "Smith 12' (og)". */
function goalText(g: HubMatch["goals"][number]): string {
  const extra = g.kind === "Own goal" ? "og" : g.kind === "Penalty" ? "pen" : g.assist ? surname(g.assist) : "";
  return `${surname(g.player)} ${g.min}'${extra ? ` (${extra})` : ""}`;
}

/** One match: date, competition, the fixture or result, and the scorers underneath. */
export default function MatchRow({ m, label, withYear }: { m: HubMatch; label: string; withYear: boolean }) {
  const res = unitedResult(m);
  const v = unitedView(m);
  const finished = m.state === "finished";
  const homeIsUnited = m.home === UNITED;
  // the data files an own goal under the team that BENEFITS, so this also counts goals United were given
  const unitedGoals = m.goals.filter((g) => g.team === UNITED);
  const otherGoals = m.goals.filter((g) => !unitedGoals.includes(g));
  const pens = v.pensFor !== null && v.pensAgainst !== null ? `${v.pensFor}–${v.pensAgainst} on penalties` : null;

  return (
    <li className="border-b border-white/10 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-white/55">
        <span>{dayLabel(m.kickoff, withYear)}</span>
        <span className="border border-white/20 px-1.5 py-px text-white/70">{label}</span>
        {m.round ? <span className="normal-case tracking-normal text-white/45">{m.round}</span> : null}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 text-base sm:text-lg">
          <span className={`truncate text-right ${homeIsUnited ? "font-bold text-white" : "text-white/75"}`}>{m.home}</span>
          <span className="min-w-[4.5rem] text-center font-display text-xl tracking-wide text-white">
            {finished ? `${m.homeGoals} – ${m.awayGoals}` : timeLabel(m.kickoff)}
          </span>
          <span className={`truncate ${homeIsUnited ? "text-white/75" : "font-bold text-white"}`}>{m.away}</span>
        </div>
        {res ? <span className={`flex h-7 w-7 flex-none items-center justify-center font-mono text-xs font-bold ${CHIP[res]}`}>{res}</span> : <span className="w-7 flex-none" />}
      </div>

      {finished && (pens || m.note) ? (
        <p className="mt-1 text-center text-xs text-white/60">{pens ? `${(v.pensFor ?? 0) > (v.pensAgainst ?? 0) ? "Won" : "Lost"} ${pens}` : m.note}</p>
      ) : null}
      {finished && m.goals.length ? (
        <p className="mt-1.5 text-center text-xs leading-relaxed text-white/55">
          {unitedGoals.length ? <span className="text-white/80">{unitedGoals.map(goalText).join(", ")}</span> : null}
          {unitedGoals.length && otherGoals.length ? <span> · </span> : null}
          {otherGoals.length ? <span>{otherGoals.map(goalText).join(", ")}</span> : null}
        </p>
      ) : null}
      {!finished && (m.venue || m.city) ? <p className="mt-1 text-center text-xs text-white/45">{[m.venue, m.city].filter(Boolean).join(", ")}</p> : null}
    </li>
  );
}
