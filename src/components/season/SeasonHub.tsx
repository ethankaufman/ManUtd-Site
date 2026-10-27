"use client";

import { useState } from "react";

import { longDate, stampLabel } from "@/lib/format";
import type { SeasonHub as Hub } from "@/lib/season";
import LeagueTable from "./LeagueTable";
import MatchMonths from "./MatchMonths";
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
  const [view, setView] = useState<"results" | "fixtures">("results");
  const stamp = hub.checked ?? hub.updated;
  const nameOf = (slug: string) => hub.competitions.find((c) => c.slug === slug)?.name ?? slug;
  const friendly = new Set(hub.competitions.filter((c) => c.kind === "friendly").map((c) => c.slug));

  const inTab = hub.matches.filter((m) => (tab === "all" ? !friendly.has(m.competition) : m.competition === tab));
  const results = inTab.filter((m) => m.state === "finished").reverse(); // newest first
  const fixtures = inTab.filter((m) => m.state !== "finished"); // soonest first
  // Results and fixtures are shown one at a time. If the chosen one is empty in this tab, show the other.
  const views = [
    { id: "results" as const, name: "Results", list: results },
    { id: "fixtures" as const, name: "Fixtures", list: fixtures },
  ];
  const shown = view === "fixtures" ? (fixtures.length ? "fixtures" : "results") : results.length ? "results" : "fixtures";
  const list = shown === "results" ? results : fixtures;
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
        {stamp ? (
          <p className="-mt-2 mb-5 text-center font-mono text-[11px] uppercase tracking-widest text-white/55">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-united-red align-middle" aria-hidden="true" />
            Data last pulled from ESPN: {stampLabel(stamp)}
          </p>
        ) : null}
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

          {fixtures.length && results.length ? (
            <div role="tablist" aria-label="Results or fixtures" className="flex justify-center">
              {views.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  type="button"
                  aria-selected={shown === v.id}
                  onClick={() => setView(v.id)}
                  className={`border px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition ${
                    shown === v.id ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
                  }`}
                >
                  {v.name} ({v.list.length})
                </button>
              ))}
            </div>
          ) : null}

          {/* the key makes the month list start fresh (newest or soonest month open) when the tab or the switch changes */}
          {list.length ? <MatchMonths key={`${tab}-${shown}`} matches={list} labelOf={(slug) => SHORT[slug] ?? slug} /> : null}

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
        {hub.updated ? `New results or fixtures were last added on ${longDate(hub.updated)}. ` : ""}
        Results come from ESPN’s public soccer data and are checked automatically twice a day, in the morning and late at night, so a match can take a few hours to appear after the final whistle.
        Times are UK time.
      </p>
    </div>
  );
}
