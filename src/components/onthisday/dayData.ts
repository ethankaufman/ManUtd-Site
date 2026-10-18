"use client";

import { useEffect, useState } from "react";

import type { DayIndex } from "@/lib/onthisday";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Today's date in the UK as "MM-DD" (the same clock the match dates use). */
export function todayKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { month: "2-digit", day: "2-digit", timeZone: "Europe/London" }).format(new Date());
  return parts;
}

/** "02-06" -> "6 February" */
export function keyLabel(key: string): string {
  const [m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export const isKey = (k: string) => /^\d\d-\d\d$/.test(k) && Number(k.slice(0, 2)) >= 1 && Number(k.slice(0, 2)) <= 12 && Number(k.slice(3)) >= 1 && Number(k.slice(3)) <= daysIn(Number(k.slice(0, 2)));
export const daysIn = (month: number) => new Date(2024, month, 0).getDate(); // 2024 is a leap year: 29 February is allowed

/** The day before or after, as "MM-DD". */
export function shiftKey(key: string, by: number): string {
  const [m, d] = key.split("-").map(Number);
  const dt = new Date(2024, m - 1, d + by);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

let cache: Promise<DayIndex> | null = null;

/** Loads the whole index once (about 50 KB zipped) and shares it between every component on the page. */
export function useDayIndex(): { index: DayIndex | null; failed: boolean } {
  const [index, setIndex] = useState<DayIndex | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    cache ??= fetch(`${BASE}/on-this-day.json`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<DayIndex>;
    });
    let live = true;
    cache.then(
      (d) => live && setIndex(d),
      () => {
        cache = null;
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);
  return { index, failed };
}
