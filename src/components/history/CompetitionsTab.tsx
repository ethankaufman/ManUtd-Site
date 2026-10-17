import { COMPETITIONS, dashed, type CompetitionSummary } from "@/lib/club";

function Card({ c }: { c: CompetitionSummary }) {
  const record = c.played ? `${c.played} played · ${c.won} won · ${c.drawn} drawn · ${c.lost} lost · ${c.goalsFor}–${c.goalsAgainst} goals` : null;
  return (
    <li className="border border-white/15 bg-[#0c0c0c] p-4">
      <h4 className="font-display text-xl uppercase tracking-wide text-white">{c.name}</h4>
      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-white/50">
        {dashed(c.first)} to {dashed(c.last)} · {c.seasons} {c.seasons === 1 ? "season" : "seasons"}
      </p>
      <p className="mt-3 text-sm text-white/80">
        {c.titles ? (
          <>
            <span className="font-display text-2xl text-united-gold">{c.titles}</span> {c.titles === 1 ? "title" : "titles"}
            {c.shared ? <span className="text-white/60"> + {c.shared} shared</span> : null}
          </>
        ) : (
          "No titles"
        )}
        {c.finals ? (
          <span className="text-white/60">
            {" "}
            · {c.finals} {c.name.includes("Shield") ? (c.finals === 1 ? "match" : "matches") : c.finals === 1 ? "final" : "finals"}
          </span>
        ) : null}
      </p>
      {c.best && !c.titles ? <p className="mt-1 text-sm text-white/65">Best: {c.best}</p> : null}
      {record ? <p className="mt-1 text-xs text-white/55">{record}</p> : null}
      {c.note ? <p className="mt-2 text-xs leading-relaxed text-white/50">{c.note}</p> : null}
    </li>
  );
}

function Group({ title, items }: { title: string; items: CompetitionSummary[] }) {
  return (
    <section>
      <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-united-red">{title}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((c) => (
          <Card key={c.name} c={c} />
        ))}
      </ul>
    </section>
  );
}

/** Every competition United have played in, counted from the season-by-season and finals data. */
export default function CompetitionsTab() {
  const ban = COMPETITIONS.europeBan;
  return (
    <div className="space-y-10">
      <Group title="The league" items={COMPETITIONS.leagues} />
      <Group title="The cups at home" items={COMPETITIONS.cups} />
      <Group title="Europe and the world" items={COMPETITIONS.europe} />
      {ban ? (
        <p className="border-l-2 border-united-red pl-3 text-sm leading-relaxed text-white/65">
          English clubs were banned from European competition for {ban.seasons} seasons, {dashed(ban.first)} to {dashed(ban.last)}, so United played no European football then.
        </p>
      ) : null}
      <p className="text-xs leading-relaxed text-white/45">
        Counted from the season-by-season table and the finals list on the other tabs, so the numbers always agree with them. A “title” in the league is finishing first in that
        division; Second Division titles came with promotion.
      </p>
    </div>
  );
}
