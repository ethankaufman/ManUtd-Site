"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import DayItems from "./DayItems";
import { keyLabel, todayKey, useDayIndex } from "./dayData";

const SHOWN = 3;

/** The home page's "On this day" section: a few things from today's date, and a link to browse every day. */
export default function TodayWidget() {
  const { index, failed } = useDayIndex();
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setKey(todayKey()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const items = key && index ? (index[key] ?? []) : [];
  // history moments first, then the newest matches
  const picked = [...items.filter((i) => i.kind === "moment"), ...items.filter((i) => i.kind === "match")].slice(0, SHOWN);

  return (
    <section id="on-this-day" className="floodlight relative bg-[#050505] px-4 pb-16 pt-16 sm:px-6" aria-labelledby="otd-title">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Every date has a story</p>
        <h2 id="otd-title" className="mt-4 font-display text-[clamp(2rem,7vw,3.5rem)] uppercase leading-[0.95] text-white">
          On this day{key ? <span className="text-united-red"> · {keyLabel(key)}</span> : null}
        </h2>
        <div className="mx-auto mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
      </div>

      <div className="mx-auto mt-6 max-w-3xl border border-white/15 bg-[#0c0c0c] px-4 sm:px-6" aria-live="polite">
        {failed ? (
          <p className="py-8 text-center text-sm text-white/60">This section could not be loaded. You can still browse every date on the full page.</p>
        ) : !index || !key ? (
          <p className="py-8 text-center text-sm text-white/45">Looking up today’s date…</p>
        ) : picked.length ? (
          <DayItems items={picked} />
        ) : (
          <p className="py-8 text-center text-sm text-white/60">United have not played a competitive match on {keyLabel(key)} since 1992. Pick another date to see what happened.</p>
        )}
      </div>

      <p className="mt-6 text-center font-mono text-xs uppercase tracking-widest">
        <Link href={key ? `/on-this-day/#${key}` : "/on-this-day/"} className="text-white transition hover:text-united-red">
          {items.length > SHOWN ? `See all ${items.length} for ${key ? keyLabel(key) : "today"} →` : "Browse every date →"}
        </Link>
      </p>
    </section>
  );
}
