"use client";

import { useState } from "react";

import { longDate } from "@/lib/format";
import { FINALS, type Final } from "@/lib/club";

const CHIP = {
  Won: "bg-united-red text-white",
  Shared: "bg-white/15 text-white",
  Lost: "border border-white/30 text-white/70",
} as const;

const FILTERS: { key: string; label: string; test: (f: Final) => boolean }[] = [
  { key: "cups", label: "All finals", test: (f) => f.comp !== "community-shield" },
  { key: "fa-cup", label: "FA Cup", test: (f) => f.comp === "fa-cup" },
  { key: "league-cup", label: "League Cup", test: (f) => f.comp === "league-cup" },
  { key: "europe", label: "Europe and the world", test: (f) => !["fa-cup", "league-cup", "community-shield"].includes(f.comp) },
  { key: "shield", label: "Charity / Community Shield", test: (f) => f.comp === "community-shield" },
];

const scoreText = (s: [number, number]) => `${s[0]}–${s[1]}`;
const pensText = (p: [number, number] | null) => (p ? `${p[0]}–${p[1]} on penalties` : "");

/** How the match ended, from United's side. */
function ending(f: { score: [number, number]; aet: boolean; pens: [number, number] | null }) {
  return `${scoreText(f.score)}${f.aet ? " after extra time" : ""}${f.pens ? `, ${pensText(f.pens)}` : ""}`;
}

function FinalRow({ f }: { f: Final }) {
  const venueLine = [f.venue, f.city].filter(Boolean).join(", ");
  return (
    <li className="border-b border-white/10 last:border-b-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 py-3 pr-1 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
          <span className="w-24 flex-none font-mono text-[11px] uppercase tracking-wider text-white/55 sm:w-28">{new Date(f.date).getUTCFullYear()}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-lg uppercase tracking-wide text-white">{f.comp_name}</span>
            <span className="block truncate text-sm text-white/65">
              v {f.opponent}
              <span className="ml-2 font-mono text-xs text-white/45">{f.replay ? `${scoreText(f.score)}, ${f.replay.kind === "second leg" ? "second leg" : "replay"} ${scoreText(f.replay.score)}` : scoreText(f.score)}</span>
            </span>
          </span>
          <span className={`flex h-6 w-14 flex-none items-center justify-center font-mono text-[11px] font-bold uppercase tracking-wider ${CHIP[f.result]}`}>{f.result}</span>
          <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
            ›
          </span>
        </summary>
        <div className="space-y-2 border-t border-white/10 bg-white/[0.02] px-3 py-5 text-sm text-white/80 sm:px-5">
          <p className="font-display text-xl uppercase tracking-wide text-white">
            Manchester United {scoreText(f.score)} {f.opponent}
          </p>
          <p>
            {longDate(f.date)} · {venueLine}
            {f.attendance ? ` · Attendance ${f.attendance.toLocaleString("en-GB")}` : ""}
          </p>
          <p className="text-white/65">
            {f.result === "Won" ? "Won" : f.result === "Lost" ? "Lost" : "Shared"}: {ending(f)}
            {f.first_kind && f.replay ? ` (${f.first_kind})` : ""}
          </p>
          {f.replay ? (
            <p className="text-white/65">
              {f.replay.kind === "second leg" ? "Second leg" : "Replay"}: {longDate(f.replay.date)}, {[f.replay.venue, f.replay.city].filter(Boolean).join(", ")}. United {ending(f.replay)}.
            </p>
          ) : null}
          {f.referee ? <p className="text-white/50">Referee: {f.referee}</p> : null}
          <p className="text-xs text-white/45">
            Season {f.season.replace("-", "–")} ·{" "}
            <a href={f.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              Wikipedia
            </a>
          </p>
        </div>
      </details>
    </li>
  );
}

/** Every final United have played (and every Charity/Community Shield match), with filters. Newest first. */
export default function FinalsTab() {
  const [filter, setFilter] = useState("cups");
  const test = FILTERS.find((x) => x.key === filter)!.test;
  const shown = [...FINALS].filter(test).sort((a, b) => b.date.localeCompare(a.date));
  const won = shown.filter((f) => f.result === "Won").length;
  const lost = shown.filter((f) => f.result === "Lost").length;

  return (
    <div>
      <div role="tablist" aria-label="Competition" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <button
            key={x.key}
            role="tab"
            type="button"
            aria-selected={filter === x.key}
            onClick={() => setFilter(x.key)}
            className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition ${
              filter === x.key ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
            }`}
          >
            {x.label} <span className="text-white/60">{FINALS.filter(x.test).length}</span>
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm text-white/60">
        {shown.length} matches: {won} won, {lost} lost{shown.length - won - lost ? `, ${shown.length - won - lost} shared` : ""}. Click one for the date, venue and how it ended.
      </p>
      <ul className="border-y border-white/15" aria-label="Finals">
        {shown.map((f) => (
          <FinalRow key={f.date + f.comp} f={f} />
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        Source: Wikipedia’s page for each final. Matches from 1992 onward were checked against our own match records. The Charity Shield (called the Community Shield since 2002) is a
        one-off match, not a final, and the UEFA Super Cup and Intercontinental Cup are also single matches (the 1968 Intercontinental Cup was over two legs); from 1939 to 1993 a drawn Charity Shield was shared rather than decided on penalties. Scores are United first.
      </p>
    </div>
  );
}
