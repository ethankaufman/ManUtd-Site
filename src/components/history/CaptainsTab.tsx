import { CAPTAINS, type Captain } from "@/lib/club";

const GROUPS: { title: string; test: (c: Captain) => boolean; open: boolean }[] = [
  { title: "Since 1992", test: (c) => c.from >= 1992 || c.to === "present", open: true },
  { title: "1945 to 1992", test: (c) => c.from >= 1945 && c.from < 1992 && c.to !== "present", open: false },
  { title: "Before 1945", test: (c) => c.from < 1945, open: false },
];

const years = (c: Captain) => (c.to === "present" ? `${c.from}–present` : c.to === String(c.from) ? String(c.from) : `${c.from}–${c.to}`);

function Row({ c }: { c: Captain }) {
  return (
    <li className="border-t border-white/10 py-3 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="w-28 flex-none font-mono text-[11px] uppercase tracking-wider text-white/55">{years(c)}</span>
        <span className="font-display text-lg uppercase tracking-wide text-white">{c.name}</span>
        {c.country ? <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">{c.country}</span> : null}
      </div>
      {c.honours.length ? (
        <p className="mt-1 pl-0 text-xs leading-relaxed text-white/55 sm:pl-32">
          <span className="text-white/40">Won as captain: </span>
          {c.honours.join(" · ")}
        </p>
      ) : null}
    </li>
  );
}

/** The club captains from 1878, newest first, in three collapsed groups. */
export default function CaptainsTab() {
  const list = [...CAPTAINS].reverse();
  return (
    <div>
      <p className="mb-4 text-sm text-white/60">
        {CAPTAINS.length} captaincies from 1878 to today (a few players held the armband twice). The first captain whose name is known is E. Thomas, from 1882.
      </p>
      <div className="border-y border-white/15">
        {GROUPS.map((g) => {
          const rows = list.filter(g.test);
          return (
            <details key={g.title} open={g.open} className="group border-b border-white/10 last:border-b-0">
              <summary className="flex cursor-pointer list-none items-center gap-4 py-3 pr-1 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="w-40 flex-none font-display text-xl uppercase tracking-wide text-white">{g.title}</span>
                <span className="min-w-0 flex-1 font-mono text-[11px] uppercase tracking-wider text-white/50">{rows.length} captaincies</span>
                <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <ul className="border-t border-white/10 bg-white/[0.02] px-3 sm:px-5">
                {rows.map((c) => (
                  <Row key={`${c.from}-${c.name}`} c={c} />
                ))}
              </ul>
            </details>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        Source: Wikipedia’s list of Manchester United captains (which draws on the club museum’s information sheet). Country is the flag shown there; honours are those won while
        the player was captain.
      </p>
    </div>
  );
}
