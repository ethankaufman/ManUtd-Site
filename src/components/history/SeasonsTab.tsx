import Link from "next/link";

import { dashed, decadeOf, SEASONS, type SeasonRow } from "@/lib/club";

const DECADES = Array.from(new Set(SEASONS.map((s) => decadeOf(s.season)))).sort((a, b) => b - a);

const CUP: Record<string, string> = { Winners: "Won", "Runners-up": "Final" };
const cupText = (v: string) => (v === "" || v === "N/A" ? "–" : (CUP[v] ?? v));
const isTitle = (s: SeasonRow) => s.pos === "1st" && (s.division === "Div 1" || s.division === "Prem");

function Cell({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td className={`px-2 py-1.5 ${right ? "text-right tabular-nums" : ""}`}>{children}</td>;
}

function Row({ s }: { s: SeasonRow }) {
  const europe = s.europe
    .map((e) => e.replace("Champions League", "CL").replace("Europa League", "EL").replace("Cup Winners' Cup", "CWC").replace("Inter-Cities Fairs Cup", "Fairs Cup").replace(" – ", ": "))
    .join(" · ");
  return (
    <tr className="border-t border-white/10 text-white/85">
      <td className="whitespace-nowrap px-2 py-1.5 font-mono text-xs">
        {parseInt(s.season, 10) >= 1992 ? (
          <Link href={`/matches/${s.season}`} className="underline underline-offset-2 hover:text-white">
            {dashed(s.season)}
          </Link>
        ) : (
          dashed(s.season)
        )}
      </td>
      <Cell>{s.division === "—" ? "–" : s.division === "Prem" ? "Premier League" : s.division}</Cell>
      <Cell right>{s.p ?? "–"}</Cell>
      <Cell right>{s.w ?? "–"}</Cell>
      <Cell right>{s.d ?? "–"}</Cell>
      <Cell right>{s.l ?? "–"}</Cell>
      <Cell right>{s.pts ?? "–"}</Cell>
      <td className={`whitespace-nowrap px-2 py-1.5 text-right ${isTitle(s) ? "font-bold text-united-gold" : ""}`}>
        {s.pos || "–"}
        {s.promoted ? " ↑" : ""}
        {s.relegated ? " ↓" : ""}
      </td>
      <Cell>{cupText(s.fa_cup)}</Cell>
      <Cell>{cupText(s.league_cup)}</Cell>
      <td className="px-2 py-1.5 text-xs">{europe || "–"}</td>
      <td className="px-2 py-1.5 text-xs">{s.scorers.length ? `${s.scorers.join(" & ")}${s.goals ? ` (${s.goals})` : ""}` : "–"}</td>
    </tr>
  );
}

/** Every season from 1886–87, one collapsed group per decade. */
export default function SeasonsTab() {
  return (
    <div>
      <p className="mb-4 text-sm text-white/60">
        League record, cup runs and top scorer for every season. Open a decade to see its seasons; from 1992–93 the season links to every match. A gold position is a
        league title.
      </p>
      <div className="border-y border-white/15">
        {DECADES.map((dec, i) => {
          const rows = SEASONS.filter((s) => decadeOf(s.season) === dec);
          const titles = rows.filter(isTitle).length;
          return (
            <details key={dec} open={i === 0} className="group border-b border-white/10 last:border-b-0">
              <summary className="flex cursor-pointer list-none items-center gap-4 py-3 pr-1 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="w-24 flex-none font-display text-xl uppercase tracking-wide text-white">{dec}s</span>
                <span className="min-w-0 flex-1 font-mono text-[11px] uppercase tracking-wider text-white/50">
                  {rows.length} seasons{titles ? ` · ${titles} league title${titles > 1 ? "s" : ""}` : ""}
                </span>
                <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <div className="overflow-x-auto border-t border-white/10 bg-white/[0.02]">
                <table className="w-full min-w-[56rem] border-collapse text-sm">
                  <thead className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                    <tr>
                      {["Season", "League", "P", "W", "D", "L", "Pts", "Pos", "FA Cup", "League Cup", "Europe", "Top scorer"].map((h, j) => (
                        <th key={h} scope="col" className={`px-2 py-2 font-normal ${j >= 2 && j <= 7 ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <Row key={s.season} s={s} />
                    ))}
                  </tbody>
                </table>
                {rows.some((s) => s.notes.length) ? (
                  <ul className="space-y-1 border-t border-white/10 px-3 py-3 text-xs leading-relaxed text-white/50">
                    {rows
                      .filter((s) => s.notes.length)
                      .map((s) => (
                        <li key={s.season}>
                          <span className="font-mono text-white/70">{dashed(s.season)}</span> {s.notes.join(" ")}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        Source: Wikipedia’s list of Manchester United seasons. Positions, points and goals for 1992 onward match the Premier League’s official tables. The club was
        called Newton Heath until 1902. FA Cup and League Cup: “Won” = winners, “Final” = runners-up, SF/QF = semi-final or quarter-final, R3 = third round.
      </p>
    </div>
  );
}
