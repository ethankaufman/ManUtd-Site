"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { seasonLabel } from "@/lib/format";
import type { SeasonBrowse } from "@/lib/season";
import MatchItem from "./MatchItem";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-white/10 px-4 py-3 text-center">
      <div className="font-display text-2xl text-white sm:text-3xl">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{label}</div>
    </div>
  );
}

/** The Every Match page body: a season dropdown, competition filters and a list of expanding matches. */
export default function MatchBrowser({ browse, seasons }: { browse: SeasonBrowse; seasons: string[] }) {
  const router = useRouter();
  const [comp, setComp] = useState("all");
  const names = new Map(browse.competitions.map((c) => [c.slug, c.name]));
  const shown = comp === "all" ? browse.matches : browse.matches.filter((m) => m.competition === comp);
  const r = browse.record;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 text-left">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.25em] text-united-red">Season</span>
          <select
            value={browse.season}
            onChange={(e) => router.push(`/matches/${e.target.value}/`)}
            className="min-w-[11rem] border border-white/30 bg-black px-3 py-2.5 font-display text-xl tracking-wide text-white focus:border-united-red focus:outline-none"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {seasonLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 font-mono text-xs uppercase tracking-widest text-white/50">{seasons.length} seasons · {browse.matches.length} matches in {seasonLabel(browse.season)}</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Played" value={r.played} />
        <Stat label="Won" value={r.won} />
        <Stat label="Drawn" value={r.drawn} />
        <Stat label="Lost" value={r.lost} />
        <Stat label="Goals for" value={r.goalsFor} />
        <Stat label="Against" value={r.goalsAgainst} />
      </div>
      <p className="mt-2 text-xs text-white/45">
        Competitive matches only (friendlies are not counted).
        {browse.leagueFinish ? ` Premier League: ${ordinal(browse.leagueFinish.rank)} of ${browse.leagueFinish.of}, ${browse.leagueFinish.points} points.` : ""}
      </p>

      <div role="tablist" aria-label="Competition" className="mt-6 flex flex-wrap gap-2">
        {[{ slug: "all", name: "All", count: browse.matches.length }, ...browse.competitions].map((c) => (
          <button
            key={c.slug}
            role="tab"
            type="button"
            aria-selected={comp === c.slug}
            onClick={() => setComp(c.slug)}
            className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition ${
              comp === c.slug ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
            }`}
          >
            {c.name} <span className="text-white/60">{c.count}</span>
          </button>
        ))}
      </div>

      <ul className="mt-4 border-y border-white/15" aria-label="Matches">
        {shown.map((m) => (
          <MatchItem key={m.id} m={m} competition={names.get(m.competition) ?? m.competition} />
        ))}
      </ul>
      <p className="mt-3 text-xs text-white/40">Click a match to open its goals, cards and line-ups.</p>
    </div>
  );
}
