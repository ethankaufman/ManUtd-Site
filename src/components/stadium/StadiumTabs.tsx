"use client";

import { useHashTab } from "@/lib/useHashTab";

import CarringtonTab from "./CarringtonTab";
import GroundsTab from "./GroundsTab";
import NewStadiumTab from "./NewStadiumTab";
import OldTraffordTab from "./OldTraffordTab";

const TABS = [
  { key: "old", label: "Old Trafford", body: <OldTraffordTab /> },
  { key: "new", label: "The new stadium", body: <NewStadiumTab /> },
  { key: "before", label: "Before Old Trafford", body: <GroundsTab /> },
  { key: "carrington", label: "Carrington", body: <CarringtonTab /> },
];

/** The stadium chapter body: four tabs. */
export default function StadiumTabs() {
  const [tab, setTab] = useHashTab(TABS.map((t) => t.key), "old");
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 text-left">
      <div role="tablist" aria-label="Stadium sections" className="mb-6 flex flex-wrap gap-2 border-b border-white/15 pb-4">
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
