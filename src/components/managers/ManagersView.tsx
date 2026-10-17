"use client";

import { useState } from "react";

import { AS_OF, isPermanent, MANAGERS, type Manager } from "@/lib/managers";
import ManagerRow from "./ManagerRow";

type Live = { m: number; w: number; d: number; l: number; gf: number; ga: number };

/** Puts the live (database) record into the current manager's open spell and recalculates his totals. */
function withLive(m: Manager, live: Live | null): Manager {
  if (!live || !m.current) return m;
  const stints = m.stints.map((s) => (s.live ? { ...s, ...live } : s));
  const totals = stints.reduce((a, s) => ({ m: a.m + s.m, w: a.w + s.w, d: a.d + s.d, l: a.l + s.l, gf: a.gf + s.gf, ga: a.ga + s.ga }), { m: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  return { ...m, stints, totals, winPct: totals.m ? Math.round((1000 * totals.w) / totals.m) / 10 : null };
}

const FILTERS = [
  { key: "all", label: "Everyone", test: () => true },
  { key: "permanent", label: "Appointed managers", test: isPermanent },
  { key: "cover", label: "Caretakers and interims", test: (m: Manager) => !isPermanent(m) },
];

/** When his most recent spell began (so Carrick, back in 2026, sorts as newest). */
const latest = (m: Manager) => m.stints[m.stints.length - 1].from;

const SORTS: { key: string; label: string; cmp: (a: Manager, b: Manager) => number }[] = [
  { key: "new", label: "Newest first", cmp: (a, b) => (latest(a) < latest(b) ? 1 : -1) },
  { key: "old", label: "Oldest first", cmp: (a, b) => (a.from < b.from ? -1 : 1) },
  { key: "matches", label: "Most matches", cmp: (a, b) => b.totals.m - a.totals.m },
  { key: "wins", label: "Best win rate (20+ matches)", cmp: (a, b) => (b.totals.m >= 20 ? b.winPct ?? 0 : -1) - (a.totals.m >= 20 ? a.winPct ?? 0 : -1) },
  { key: "trophies", label: "Most trophies", cmp: (a, b) => b.honours.length - a.honours.length || b.totals.m - a.totals.m },
];

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border border-white/10 px-3 py-4 text-center">
      <div className="font-display text-4xl leading-none text-united-gold sm:text-5xl">{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">{label}</div>
    </div>
  );
}

/** The Managers page body: filter, sort and a collapsed row per manager. */
export default function ManagersView({ live }: { live: Live | null }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");
  const people = MANAGERS.map((m) => withLive(m, live));
  const shown = people.filter(FILTERS.find((f) => f.key === filter)!.test).sort(SORTS.find((s) => s.key === sort)!.cmp);
  const top = [...people].sort((a, b) => b.honours.length - a.honours.length)[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 text-left">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat value={people.length} label="People in charge" />
        <Stat value={people.filter(isPermanent).length} label="Appointed managers" />
        <Stat value={people.filter((m) => !isPermanent(m)).length} label="Caretakers and interims" />
        <Stat value={top.honours.length} label={`Trophies under ${top.name.split(" ").pop()}`} />
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div role="tablist" aria-label="Who to show" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              type="button"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition ${
                filter === f.key ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
              }`}
            >
              {f.label} <span className="text-white/60">{people.filter(f.test).length}</span>
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-united-red">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-white/30 bg-black px-3 py-2 font-mono text-xs uppercase tracking-wider text-white focus:border-united-red focus:outline-none">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-4 border-y border-white/15" aria-label="Managers">
        {shown.map((m) => (
          <ManagerRow key={m.slug} m={m} />
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        Click a manager to open the photo, the story, the record and the trophies. Records count every competitive match and no friendlies, as Wikipedia’s list does; they are as of {AS_OF}, and the
        current manager’s record is updated automatically as results come in. “Appointed managers” includes the early secretary-managers (the secretary of the committee that chose the team) and
        one player-manager; the acting secretary T. J. Wallworth was never an official manager. Win rates for caretakers are based on very few matches.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/45">
        Sources: Wikipedia’s list of Manchester United managers and its managerial history (CC BY-SA). Every record from 2013 on was recalculated from our own match data and equals Wikipedia’s
        matches, wins, draws and losses; each manager’s trophies were counted from our finals and season data and equal the honours Wikipedia lists for him. For Ole Gunnar Solskjær and
        Michael Carrick’s current spell Wikipedia’s goal totals differ from ours; we show ours, which agree with the official Premier League results.
      </p>
    </div>
  );
}
