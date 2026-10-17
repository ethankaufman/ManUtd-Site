"use client";

import { useState } from "react";

import { GROUPS, inPeriod, TROPHIES } from "@/lib/honours";
import AwardsPanel from "./AwardsPanel";
import TrophyCard from "./TrophyCard";

function Segment({ options, value, onChange, label }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          role="tab"
          type="button"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={`border px-4 py-2 font-mono text-xs uppercase tracking-widest transition ${
            value === o.key ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-white/10 px-3 py-4 text-center">
      <div className="font-display text-4xl leading-none text-united-gold sm:text-5xl">{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">{label}</div>
    </div>
  );
}

/** The Honours page body: all time or since 1992, trophies or individual awards. */
export default function HonoursView() {
  const [period, setPeriod] = useState("all");
  const [tab, setTab] = useState("trophies");
  const since = period === "since";

  const wins = (key: string) => (TROPHIES.find((t) => t.key === key)?.entries ?? []).filter((e) => inPeriod(e.season, since));
  const leagueTitles = wins("premier-league").length + wins("first-division").length;
  const total = TROPHIES.reduce((n, t) => n + t.entries.filter((e) => inPeriod(e.season, since)).length, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 text-left">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
        <Segment
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { key: "all", label: "All time" },
            { key: "since", label: "Since 1992" },
          ]}
        />
        <Segment
          label="What to show"
          value={tab}
          onChange={setTab}
          options={[
            { key: "trophies", label: "Trophies" },
            { key: "awards", label: "Individual awards" },
          ]}
        />
      </div>

      {tab === "trophies" ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Stat value={total} label="Honours" />
            <Stat value={leagueTitles} label="League titles" />
            <Stat value={wins("fa-cup").length} label="FA Cups" />
            <Stat value={wins("league-cup").length} label="League Cups" />
            <Stat value={wins("european-cup").length} label="European Cups" />
          </div>
          <p className="-mt-6 text-xs leading-relaxed text-white/45">
            {since
              ? "Since 1992 means from the 1992–93 season, the first of the Premier League. A trophy won in spring 1992 (the 1991–92 League Cup) or in November 1991 (the Super Cup) belongs to the earlier period."
              : "Counted the way Wikipedia counts the club’s honours: 20 league titles, 2 Second Division titles, 21 Community Shields (4 of them shared) and the rest."}
          </p>

          {GROUPS.map((g) => {
            const cards = TROPHIES.filter((t) => t.type === g.type)
              .map((t) => ({ t, w: t.entries.filter((e) => inPeriod(e.season, since)) }))
              .filter((x) => x.w.length);
            if (!cards.length) return null;
            return (
              <section key={g.type} aria-label={g.title}>
                <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-united-red">{g.title}</h3>
                <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cards.map(({ t, w }) => (
                    <TrophyCard key={t.key} trophy={t} wins={w} />
                  ))}
                </ul>
              </section>
            );
          })}
          <p className="text-xs leading-relaxed text-white/45">
            Every honour was counted from the club’s season-by-season record and the list of finals (see the History chapter) and agrees with Wikipedia’s honours table. Trophy pictures are
            free-licensed photos from Wikimedia Commons; the Second Division title and the FIFA Club World Cup have no free picture.
          </p>
        </div>
      ) : (
        <AwardsPanel since1992={since} />
      )}
    </div>
  );
}
