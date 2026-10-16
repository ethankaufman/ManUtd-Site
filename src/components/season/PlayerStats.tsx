import type { PlayerStat } from "@/lib/data";

function Board({ title, rows, unit }: { title: string; rows: { name: string; n: number }[]; unit: string }) {
  const top = rows[0]?.n ?? 0;
  return (
    <div className="border border-white/15 bg-[#0c0c0c] p-5">
      <h3 className="font-display text-xl uppercase tracking-wide text-white">{title}</h3>
      {rows.length ? (
        <ol className="mt-3 space-y-2.5">
          {rows.map((r, i) => (
            <li key={r.name} className="text-sm">
              <div className="flex items-baseline justify-between gap-3 text-white/85">
                <span>
                  <span className="mr-2 font-mono text-xs text-white/40">{i + 1}</span>
                  {r.name}
                </span>
                <span className="font-mono tabular-nums text-white">
                  {r.n} <span className="text-white/40">{unit}</span>
                </span>
              </div>
              <div className="mt-1 h-0.5 bg-white/10">
                <div className="h-full bg-united-red" style={{ width: `${top ? (r.n / top) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-white/55">None yet.</p>
      )}
    </div>
  );
}

/** Top scorers, assists and cards for United across every competition so far. */
export default function PlayerStats({ players }: { players: PlayerStat[] }) {
  const top = (pick: (p: PlayerStat) => number) =>
    players
      .filter((p) => pick(p) > 0)
      .sort((a, b) => pick(b) - pick(a) || a.name.localeCompare(b.name))
      .slice(0, 8)
      .map((p) => ({ name: p.name, n: pick(p) }));
  const yellow = players.reduce((n, p) => n + p.yellow, 0);
  const red = players.reduce((n, p) => n + p.red, 0);
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        <Board title="Top scorers" rows={top((p) => p.goals)} unit="goals" />
        <Board title="Most assists" rows={top((p) => p.assists)} unit="assists" />
        <Board title="Most cards" rows={top((p) => p.yellow + p.red)} unit="cards" />
      </div>
      <p className="mt-3 text-center text-xs text-white/45">
        United’s own goals only (own goals scored by opponents are not credited to a player). Cards are yellow and red together.
        So far: {yellow} yellow and {red} red.
      </p>
    </div>
  );
}
