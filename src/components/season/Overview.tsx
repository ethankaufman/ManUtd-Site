import type { HubCompetition, HubMatch, Record5 } from "@/lib/season";
import { dayLabel, timeLabel } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-white/15 bg-[#0c0c0c] px-4 py-4 text-center">
      <div className="font-display text-4xl leading-none text-white sm:text-5xl">{value}</div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-white/55">{label}</div>
    </div>
  );
}

/** The top of the page: United's record, the next match, and one line per competition. */
export default function Overview({
  overall,
  next,
  competitions,
  nameOf,
}: {
  overall: Record5;
  next: HubMatch | null;
  competitions: HubCompetition[];
  nameOf: (slug: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Played" value={overall.played} />
        <Stat label="Won · Drawn · Lost" value={`${overall.won} · ${overall.drawn} · ${overall.lost}`} />
        <Stat label="Goals for" value={overall.goalsFor} />
        <Stat label="Goals against" value={overall.goalsAgainst} />
      </div>
      <p className="text-center text-xs text-white/45">Every competition so far this season, not counting pre-season friendlies.</p>

      {next ? (
        <div className="border border-united-red bg-united-red/10 px-5 py-5 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-united-red">Next match</p>
          <p className="mt-3 font-display text-2xl uppercase tracking-wide text-white sm:text-4xl">
            {next.home} <span className="text-white/50">v</span> {next.away}
          </p>
          <p className="mt-2 text-white/80">
            {dayLabel(next.kickoff, true)} · {timeLabel(next.kickoff)} UK time
          </p>
          <p className="mt-1 text-sm text-white/55">
            {nameOf(next.competition)}
            {next.round ? ` · ${next.round}` : ""}
            {next.venue ? ` · ${next.venue}` : ""}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {competitions.map((c) => (
          <div key={c.slug} className="border border-white/15 bg-[#0c0c0c] px-4 py-4">
            <p className="font-display text-xl uppercase tracking-wide text-white">{c.name}</p>
            <p className="mt-1 text-sm leading-snug text-white/70">{c.status}</p>
            {c.record && c.kind !== "friendly" ? (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-white/45">
                P{c.record.played} · W{c.record.won} · D{c.record.drawn} · L{c.record.lost} · GF{c.record.goalsFor} · GA{c.record.goalsAgainst}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
