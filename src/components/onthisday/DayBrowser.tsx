"use client";

import { useEffect, useState } from "react";

import DayItems from "./DayItems";
import { daysIn, isKey, keyLabel, MONTHS, shiftKey, todayKey, useDayIndex } from "./dayData";

const BTN = "border border-white/30 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black";
const SELECT = "border border-white/30 bg-black px-3 py-2 font-mono text-sm text-white";

/** Pick any date and see everything United did on it, newest first. The date is kept in the address (#02-06) so it can be shared. */
export default function DayBrowser() {
  const { index, failed } = useDayIndex();
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const fromHash = window.location.hash.slice(1);
      setKey(isKey(fromHash) ? fromHash : todayKey());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  function go(next: string) {
    setKey(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  const items = key && index ? (index[key] ?? []) : [];
  const matches = items.filter((i) => i.kind === "match").length;
  const month = key ? Number(key.slice(0, 2)) : 1;
  const day = key ? Number(key.slice(3)) : 1;
  const two = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 text-left">
      {key ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" className={BTN} onClick={() => go(shiftKey(key, -1))} aria-label="Previous day">
            ← Day
          </button>
          <label className="sr-only" htmlFor="otd-month">
            Month
          </label>
          <select
            id="otd-month"
            className={SELECT}
            value={month}
            onChange={(e) => {
              const m = Number(e.target.value);
              go(`${two(m)}-${two(Math.min(day, daysIn(m)))}`);
            }}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="otd-day">
            Day
          </label>
          <select id="otd-day" className={SELECT} value={day} onChange={(e) => go(`${two(month)}-${two(Number(e.target.value))}`)}>
            {Array.from({ length: daysIn(month) }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button type="button" className={BTN} onClick={() => go(shiftKey(key, 1))} aria-label="Next day">
            Day →
          </button>
          <button type="button" className={`${BTN} border-united-red`} onClick={() => go(todayKey())}>
            Today
          </button>
        </div>
      ) : null}

      <h2 className="mt-10 text-center font-display text-[clamp(1.8rem,6vw,3rem)] uppercase leading-none text-white">{key ? keyLabel(key) : " "}</h2>
      <p className="mt-3 text-center font-mono text-xs uppercase tracking-widest text-white/55" aria-live="polite">
        {failed ? "Could not load the data" : !index || !key ? "Loading…" : items.length ? `${matches} match${matches === 1 ? "" : "es"}${items.length > matches ? ` · ${items.length - matches} from the club’s history` : ""}` : "Nothing on this date"}
      </p>

      <div className="mt-6 border border-white/15 bg-[#0c0c0c] px-4 sm:px-6">
        {items.length ? <DayItems items={items} /> : <p className="py-10 text-center text-sm text-white/60">{index && key ? "United have not played a competitive match on this date since 1992, and nothing from the club’s earlier history is dated to it." : failed ? "Please try again later." : ""}</p>}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-white/50">
        Matches are every competitive game since 1992–93 (friendlies are not counted), plus every cup final before that and the dated moments from the club’s history. Dates are UK dates.
        Results and scorers come from the match data on the Every Match chapter.
      </p>
    </div>
  );
}
