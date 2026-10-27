import { monthKey, monthLabel } from "@/lib/format";
import type { HubMatch } from "@/lib/season";
import MatchRow from "./MatchRow";

/** Matches grouped by month, each month a native drop-down (<details>) that shows how many matches it holds. */
export default function MatchMonths({ matches, labelOf }: { matches: HubMatch[]; labelOf: (slug: string) => string }) {
  // the matches arrive already in the order to show, so a month is a run of neighbours
  const months: { key: string; label: string; matches: HubMatch[] }[] = [];
  for (const m of matches) {
    const key = monthKey(m.kickoff);
    const last = months[months.length - 1];
    if (last && last.key === key) last.matches.push(m);
    else months.push({ key, label: monthLabel(m.kickoff), matches: [m] });
  }

  return (
    <div className="space-y-2">
      {months.map((month, i) => (
        <details key={month.key} open={i === 0} className="group border border-white/15 bg-[#0c0c0c]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 [&::-webkit-details-marker]:hidden">
            <span className="font-display text-xl uppercase tracking-wide text-white">{month.label}</span>
            <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-white/60">
              {month.matches.length} {month.matches.length === 1 ? "match" : "matches"}
              <span aria-hidden="true" className="text-united-red transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <ul className="border-t border-white/10 px-4">
            {month.matches.map((m) => (
              <MatchRow key={m.id} m={m} label={labelOf(m.competition)} withYear={false} />
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
