"use client";

import { useEffect, useMemo, useState } from "react";

import DayItems from "@/components/onthisday/DayItems";
import { useDayIndex } from "@/components/onthisday/dayData";
import { GROUPS, groupOf, opponentsFrom, RIVALS, slugOf, summarise, type Group, type Tally } from "@/lib/h2h";
import type { DayMatch } from "@/lib/onthisday";

const CHIP = {
  W: "bg-united-red text-white",
  D: "bg-white/15 text-white",
  L: "border border-white/30 text-white/70",
} as const;
const GROUP_LABEL: Record<Group, string> = { League: "Premier League", "FA Cup": "FA Cup", "League Cup": "League Cup", Europe: "Europe", "Community Shield": "Community Shield", World: "World club games" };
const FIRST_SHOWN = 10;
const SELECT = "w-full max-w-sm border border-white/30 bg-black px-3 py-2 font-mono text-sm text-white";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-white/10 px-4 py-3 text-center">
      <div className="whitespace-nowrap font-display text-2xl text-white">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{label}</div>
    </div>
  );
}

const pct = (t: Tally) => (t.p ? `${Math.round((t.w / t.p) * 100)}%` : "–");
const gd = (t: Tally) => (t.gf - t.ga > 0 ? `+${t.gf - t.ga}` : String(t.gf - t.ga));
const dateText = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/** "United 3–1 Arsenal" from United's side, with the date. */
function MatchLine({ m }: { m: DayMatch }) {
  const where = m.venue ? m.venue.split(",")[0] : m.home === true ? "home" : m.home === false ? "away" : "neutral ground";
  return (
    <span>
      <span className="font-bold text-white">
        {m.us}–{m.them}
      </span>{" "}
      <span className="text-white/60">
        ({where}, {dateText(m.date)} · {m.comp})
      </span>
    </span>
  );
}

function SplitRow({ label, t }: { label: string; t: Tally }) {
  if (!t.p) return null;
  return (
    <tr className="border-t border-white/10 text-white/85">
      <td className="px-2 py-1.5">{label}</td>
      <td className="px-2 py-1.5 text-right tabular-nums">{t.p}</td>
      <td className="px-2 py-1.5 text-right tabular-nums">{t.w}</td>
      <td className="px-2 py-1.5 text-right tabular-nums">{t.d}</td>
      <td className="px-2 py-1.5 text-right tabular-nums">{t.l}</td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
        {t.gf}–{t.ga}
      </td>
    </tr>
  );
}

function SplitTable({ title, rows }: { title: string; rows: { label: string; t: Tally }[] }) {
  return (
    <div className="overflow-x-auto border border-white/15 bg-[#0c0c0c] p-4">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-united-red">{title}</h3>
      <table className="mt-2 w-full min-w-[20rem] text-sm">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-white/45">
            <th className="px-2 py-1 font-normal" />
            <th className="px-2 py-1 text-right font-normal">P</th>
            <th className="px-2 py-1 text-right font-normal">W</th>
            <th className="px-2 py-1 text-right font-normal">D</th>
            <th className="px-2 py-1 text-right font-normal">L</th>
            <th className="px-2 py-1 text-right font-normal">Goals</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <SplitRow key={r.label} {...r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Pick a club and see United's record against them since 1992–93. The club is kept in the address (#liverpool) so it can be shared. */
export default function HeadToHead() {
  const { index, failed } = useDayIndex();
  const opponents = useMemo(() => (index ? opponentsFrom(index) : []), [index]);
  const [slug, setSlug] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | "all">("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSlug(window.location.hash.slice(1) || slugOf(RIVALS[0])), 0);
    return () => window.clearTimeout(t);
  }, []);

  const opp = opponents.find((o) => o.slug === slug) ?? null;
  const summary = useMemo(() => (opp ? summarise(opp.matches) : null), [opp]);

  function pick(next: string) {
    setSlug(next);
    setGroup("all");
    setShowAll(false);
    window.history.replaceState(null, "", `#${next}`);
  }

  const rivals = RIVALS.map((r) => opponents.find((o) => o.name === r)).filter((o) => o !== undefined);
  const groupsHere = summary ? summary.byGroup.map((g) => g.group) : [];
  const meetings = opp ? (group === "all" ? opp.matches : opp.matches.filter((m) => groupOf(m.comp) === group)) : [];
  const shown = showAll ? meetings : meetings.slice(0, FIRST_SHOWN);
  const t = summary?.total;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 text-left">
      {failed ? <p className="py-10 text-center text-sm text-white/60">The match data could not be loaded. Please try again later.</p> : null}
      {!index && !failed ? <p className="py-10 text-center font-mono text-xs uppercase tracking-widest text-white/50">Loading…</p> : null}

      {index ? (
        <>
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Quick picks">
            {rivals.map((o) => (
              <button
                key={o.slug}
                type="button"
                aria-pressed={slug === o.slug}
                onClick={() => pick(o.slug)}
                className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition ${
                  slug === o.slug ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <label className="sr-only" htmlFor="h2h-opponent">
              Choose any club
            </label>
            <select id="h2h-opponent" className={SELECT} value={opp?.slug ?? ""} onChange={(e) => pick(e.target.value)}>
              {opp ? null : <option value="">Choose any club ({opponents.length})…</option>}
              {opponents.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name} ({o.matches.length})
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}

      {index && !opp ? <p className="mt-10 text-center text-sm text-white/60">We have no competitive match against that club. Pick one from the list.</p> : null}

      {opp && summary && t ? (
        <div className="mt-10">
          <h2 className="text-center font-display text-[clamp(1.8rem,6vw,3rem)] uppercase leading-none text-white">
            United <span className="text-united-red">v</span> {opp.name}
          </h2>
          <p className="mt-3 text-center font-mono text-xs uppercase tracking-widest text-white/55">
            {t.p} competitive match{t.p === 1 ? "" : "es"} · {summary.first.date.slice(0, 4)}
            {summary.last.date.slice(0, 4) !== summary.first.date.slice(0, 4) ? `–${summary.last.date.slice(0, 4)}` : ""}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Stat label="Played" value={t.p} />
            <Stat label="Won" value={t.w} />
            <Stat label="Drawn" value={t.d} />
            <Stat label="Lost" value={t.l} />
            <Stat label="Goals" value={`${t.gf}–${t.ga}`} />
            <Stat label="Win rate" value={pct(t)} />
          </div>

          {t.p ? (
            <div className="mt-4 flex h-3 w-full overflow-hidden border border-white/15" role="img" aria-label={`${t.w} won, ${t.d} drawn, ${t.l} lost`}>
              <div className="bg-united-red" style={{ width: `${(t.w / t.p) * 100}%` }} />
              <div className="bg-white/40" style={{ width: `${(t.d / t.p) * 100}%` }} />
              <div className="bg-black" style={{ width: `${(t.l / t.p) * 100}%` }} />
            </div>
          ) : null}
          <p className="mt-2 text-xs text-white/45">
            Red = won, grey = drawn, black = lost. Goal difference {gd(t)}.
            {summary.shootouts.won + summary.shootouts.lost
              ? ` A match decided on penalties counts as a draw here (United won ${summary.shootouts.won} and lost ${summary.shootouts.lost} shoot-out${summary.shootouts.won + summary.shootouts.lost === 1 ? "" : "s"} against them).`
              : ""}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border border-white/15 bg-[#0c0c0c] p-4">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-united-red">Moments</h3>
              <dl className="mt-3 space-y-3 text-sm leading-snug">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-white/45">Last five (newest first)</dt>
                  <dd className="mt-1.5 flex gap-1.5">
                    {summary.form.map((m, i) => (
                      <span key={i} className={`flex h-6 w-6 items-center justify-center font-mono text-xs font-bold ${CHIP[m.res]}`} title={`${m.us}–${m.them}, ${dateText(m.date)}`}>
                        {m.res}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-white/45">Biggest win</dt>
                  <dd className="mt-0.5 text-white/80">{summary.biggestWin ? <MatchLine m={summary.biggestWin} /> : "None yet"}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-white/45">Heaviest defeat</dt>
                  <dd className="mt-0.5 text-white/80">{summary.heaviestDefeat ? <MatchLine m={summary.heaviestDefeat} /> : "None"}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-white/45">First meeting in our data</dt>
                  <dd className="mt-0.5 text-white/80">
                    <MatchLine m={summary.first} />
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-white/45">Latest meeting</dt>
                  <dd className="mt-0.5 text-white/80">
                    <MatchLine m={summary.last} />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border border-white/15 bg-[#0c0c0c] p-4">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-united-red">Most goals against them</h3>
              {summary.scorers.length ? (
                <ol className="mt-3 space-y-1.5 text-sm text-white/85">
                  {summary.scorers.map((s) => (
                    <li key={s.name} className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-1.5 last:border-b-0">
                      <span>{s.name}</span>
                      <span className="font-display text-xl text-united-gold">{s.goals}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-white/60">No United scorers are recorded for these matches.</p>
              )}
              <p className="mt-3 text-xs leading-relaxed text-white/45">
                Counted by surname, because the early seasons only list surnames.
                {summary.ownGoals ? ` ${summary.ownGoals} more came from their own players.` : ""}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SplitTable title="Home and away" rows={[{ label: "Home", t: summary.home }, { label: "Away", t: summary.away }, { label: "Neutral ground", t: summary.neutral }]} />
            <SplitTable title="By competition" rows={summary.byGroup.map((g) => ({ label: GROUP_LABEL[g.group], t: g.t }))} />
          </div>

          <h3 className="mt-10 font-display text-2xl uppercase tracking-wide text-white">Every meeting</h3>
          {groupsHere.length > 1 ? (
            <div role="group" aria-label="Competition" className="mt-3 flex flex-wrap gap-2">
              {(["all", ...GROUPS.filter((g) => groupsHere.includes(g))] as (Group | "all")[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={group === g}
                  onClick={() => {
                    setGroup(g);
                    setShowAll(false);
                  }}
                  className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition ${
                    group === g ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
                  }`}
                >
                  {g === "all" ? "All" : GROUP_LABEL[g]}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-4 border border-white/15 bg-[#0c0c0c] px-4 sm:px-6">
            <DayItems items={shown} dated />
          </div>
          {meetings.length > FIRST_SHOWN ? (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="border border-white/30 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black"
              >
                {showAll ? "Show fewer" : `Show all ${meetings.length} meetings`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {index ? (
        <p className="mt-10 text-center text-xs leading-relaxed text-white/50">
          Every competitive match since 1992–93 (friendlies are not counted), from the match data on the Every Match chapter. Earlier meetings are not in our data, so these are not all-time records.
          A match decided on penalties counts as a draw. Home and away follow the match data, so a final or Community Shield is listed under whichever side was named home.
        </p>
      ) : null}
    </div>
  );
}
