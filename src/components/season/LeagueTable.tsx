import { UNITED, type TableRow } from "@/lib/season";

/**
 * A league table with United's row highlighted. A thin coloured bar on the left marks the zones
 * (only the site's own colours: gold = best places, white = middle places, red = danger).
 */
function zoneBar(zone: string | null): string {
  if (!zone) return "bg-transparent";
  if (zone === "Champions League" || zone === "Qualifies for round of 16") return "bg-united-gold";
  if (zone === "Relegation" || zone === "Eliminated") return "bg-united-red";
  return "bg-white/60"; // Europa League places, playoff places
}

export default function LeagueTable({ rows, caption }: { rows: TableRow[]; caption: string }) {
  const zones = [...new Set(rows.map((r) => r.zone).filter((z): z is string => !!z))];
  return (
    <div>
      <div className="max-h-[30rem] overflow-auto border border-white/15 bg-[#0c0c0c]">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-[#111] font-mono text-[11px] uppercase tracking-widest text-white/55">
            <tr>
              <th className="w-1 p-0" aria-hidden="true" />
              <th scope="col" className="py-2 pl-3 pr-2 text-left font-normal">#</th>
              <th scope="col" className="px-2 py-2 text-left font-normal">Team</th>
              {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
                <th key={h} scope="col" className={`px-2 py-2 text-right font-normal ${h === "Pts" ? "pr-3 text-white" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const us = r.team === UNITED;
              const gd = r.goalsFor - r.goalsAgainst;
              return (
                <tr key={r.team} className={`border-t border-white/10 ${us ? "bg-united-red/20 font-bold text-white" : "text-white/80"}`}>
                  <td className={`w-1 p-0 ${zoneBar(r.zone)}`} />
                  <td className="py-1.5 pl-3 pr-2 font-mono text-white/60">{r.rank}</td>
                  <td className="px-2 py-1.5">{r.team}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.played}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.won}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.drawn}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.lost}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.goalsFor}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.goalsAgainst}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{gd > 0 ? `+${gd}` : gd}</td>
                  <td className="px-2 py-1.5 pr-3 text-right font-bold tabular-nums text-white">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {zones.length ? (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/55">
          {zones.map((z) => (
            <li key={z} className="flex items-center gap-2">
              <span className={`h-3 w-1 ${zoneBar(z)}`} aria-hidden="true" />
              {z}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
