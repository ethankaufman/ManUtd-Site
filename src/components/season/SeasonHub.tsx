"use client";

import { useState } from "react";

import { longDate } from "@/lib/format";
import type { SeasonHub as Hub } from "@/lib/season";
import LeagueTable from "./LeagueTable";
import MatchRow from "./MatchRow";
import Overview from "./Overview";
import PlayerStats from "./PlayerStats";

/** Short labels for the little competition tag on each match row. */
const SHORT: Record<string, string> = {
  "premier-league": "PL",
  "champions-league": "UCL",
  "europa-league": "UEL",
  "conference-league": "UECL",
  "carabao-cup": "League Cup",
  "fa-cup": "FA Cup",
  "community-shield": "Shield",
  friendlies: "Friendly",
};

function Heading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mb-5 text-center">
      {kicker ? <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">{kicker}</p> : null}
      <h2 className="mt-2 font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">{title}</h2>
      <div className="mx-auto mt-3 h-px w-12 bg-united-red" aria-hidden="true" />
    </div>
  );
}

export default function SeasonHub({ hub }: { hub: Hub }) {
  const [tab, setTab] = useState("all");
  const nameOf = (slug: string) => hub.competitions.find((c) => c.slug === slug)?.name ?? slug;
  const friendly = new Set(hub.competitions.filter((c) => c.kind === "friendly").map((c) => c.slug));

  const firstYear = parseInt(hub.season, 10); // "2026-27" -> 2026; dates in 2027 show their year
  const withYear = (iso: string) => new Date(iso).getUTCFullYear() !== firstYear;

  const inTab = hub.matches.filter((m) => (tab === "all" ? !friendly.has(m.competition) : m.competition === tab));
  const results = inTab.filter((m) => m.state === "finished").reverse(); // newest first
  const fixtures = inTab.filter((m) => m.state !== "finished"); // soonest first
  const next = hub.matches.find((m) => m.state === "scheduled" && !friendly.has(m.competition)) ?? null;
  const comp = hub.competitions.find((c) => c.slug === tab) ?? null;

  const tabs = [{ slug: "all", name: "All competitions" }, ...hub.competitions.map((c) => ({ slug: c.slug, name: c.name }))];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-14 px-4 pb-20 text-left">
      <section aria-label="Season at a glance">
        <Overview overall={hub.overall} next={next} competitions={hub.competitions} nameOf={nameOf} />
      </section>

      <section aria-label="Matches and tables">
        <Heading kicker="Every competition" title="Matches and tables" />
        <div role="tablist" aria-label="Competition" className="mb-6 flex flex-wrap justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.slug}
              role="tab"
              type="button"
              aria-selected={tab === t.slug}
              onClick={() => setTab(t.slug)}
              className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition ${
                tab === t.slug ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="space-y-8">
          {comp ? <p className="text-center text-white/75">{comp.status}</p> : null}

          {comp?.table ? <LeagueTable rows={comp.table} caption={`${comp.name} table`} /> : null}

          {fixtures.length ? (
            <div>
              <h3 className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-united-red">Fixtures</h3>
              <ul>{fixtures.map((m) => <MatchRow key={m.id} m={m} label={SHORT[m.competition] ?? m.competition} withYear={withYear(m.kickoff)} />)}</ul>
            </div>
          ) : null}

          {results.length ? (
            <div>
              <h3 className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-united-red">Results</h3>
              <ul>{results.map((m) => <MatchRow key={m.id} m={m} label={SHORT[m.competition] ?? m.competition} withYear={withYear(m.kickoff)} />)}</ul>
            </div>
          ) : null}

          {!fixtures.length && !results.length ? (
            <p className="border border-white/15 bg-[#0c0c0c] px-5 py-6 text-center text-white/70">No matches yet. They will appear here as soon as the draw or fixtures are published.</p>
          ) : null}
        </div>
      </section>

      <section aria-label="Player statistics">
        <Heading kicker="All competitions" title="The players" />
        <PlayerStats players={hub.players} />
      </section>

      <p className="text-center text-xs leading-relaxed text-white/40">
        {hub.updated ? `Last updated ${longDate(hub.updated)}. ` : ""}
        Results come from ESPN’s public soccer data and are refreshed automatically every day, so a match can take a few hours to appear after the final whistle.
        Times are UK time.
      </p>
    </div>
  );
}
