"use client";

import { useHashTab } from "@/lib/useHashTab";

import CaptainsTab from "./CaptainsTab";
import CompetitionsTab from "./CompetitionsTab";
import FinalsTab from "./FinalsTab";
import SeasonsTab from "./SeasonsTab";
import TimelineTab from "./TimelineTab";

const TABS = [
  { key: "timeline", label: "Timeline", body: <TimelineTab /> },
  { key: "seasons", label: "Every season", body: <SeasonsTab /> },
  { key: "finals", label: "Finals", body: <FinalsTab /> },
  { key: "competitions", label: "Competitions", body: <CompetitionsTab /> },
  { key: "captains", label: "Captains", body: <CaptainsTab /> },
];

/** The History page body: five tabs, each with collapsed groups so nothing is an endless scroll. */
export default function HistoryTabs() {
  const [tab, setTab] = useHashTab(TABS.map((t) => t.key), "timeline");
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 text-left">
      <div role="tablist" aria-label="History sections" className="mb-6 flex flex-wrap gap-2 border-b border-white/15 pb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`border px-4 py-2 font-mono text-xs uppercase tracking-widest transition ${
              tab === t.key ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={current.key}>{current.body}</div>
    </div>
  );
}
