import type { SearchEntry } from "@/lib/searchindex";

/** Lower-case, no accents ("Solskjær" -> "solskjaer", "Şükrü" -> "sukru"), punctuation turned into spaces ("2008/09" -> "2008 09"). */
export function normalise(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/ø/gi, "o")
    .replace(/ł/gi, "l")
    .replace(/đ/gi, "d")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type Prepared = SearchEntry & { title: string; hay: string };

export const prepare = (entries: SearchEntry[]): Prepared[] => entries.map((e) => ({ ...e, title: normalise(e.t), hay: normalise(`${e.t} ${e.s ?? ""} ${e.w ?? ""} ${e.k}`) }));

// kinds shown first when scores tie
const KIND_ORDER = ["Player", "Legend", "Manager", "Head to head", "Chapter", "Page", "Season", "Stadium", "Honour", "Final", "Captain", "History"];

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** "6 feb", "february 6", "6th of February" -> "02-06", or null. Only a real calendar day counts (29 February is allowed). */
export function dateKey(q: string): string | null {
  const words = normalise(q).replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1").replace(/\bof\b/g, " ").split(/\s+/).filter(Boolean);
  if (words.length !== 2) return null;
  const [a, b] = words;
  const monthOf = (w: string) => (w.length >= 3 ? MONTHS.findIndex((m) => m.startsWith(w)) : -1);
  const [dayWord, monthWord] = /^\d+$/.test(a) ? [a, b] : [b, a];
  const month = monthOf(monthWord);
  const day = Number(dayWord);
  if (month < 0 || !/^\d+$/.test(dayWord) || day < 1 || day > new Date(2024, month + 1, 0).getDate()) return null;
  return `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Does a word of `text` start with `t`? A plural is allowed to find its singular: "finals" finds "final". */
function starts(text: string, t: string): boolean {
  const plain = t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : null;
  return [t, plain].some((w) => w !== null && (text.startsWith(w) || text.includes(` ${w}`)));
}

export function search(entries: Prepared[], query: string, limit = 30): SearchEntry[] {
  const q = normalise(query);
  if (!q) return [];
  const tokens = q.split(" ");
  const results: { e: Prepared; score: number }[] = [];
  for (const e of entries) {
    // every word typed must start a word somewhere in the entry ("finals" also finds "final")
    if (!tokens.every((t) => starts(e.hay, t))) continue;
    let score = 0;
    if (e.title === q) score += 100;
    else if (e.title.startsWith(q)) score += 70;
    for (const t of tokens) score += starts(e.title, t) ? 30 : 8;
    // a person whose NAME matches comes before an event that only mentions them
    if ((e.k === "Player" || e.k === "Legend" || e.k === "Manager") && tokens.every((t) => starts(e.title, t))) score += 80;
    results.push({ e, score });
  }
  results.sort((a, b) => b.score - a.score || KIND_ORDER.indexOf(a.e.k) - KIND_ORDER.indexOf(b.e.k) || a.e.t.localeCompare(b.e.t, "en"));
  const found: SearchEntry[] = results.slice(0, limit).map(({ e }) => ({ t: e.t, k: e.k, u: e.u, s: e.s }));
  const day = dateKey(query);
  if (day) {
    const [m, d] = day.split("-").map(Number);
    found.unshift({ t: `${d} ${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)}`, k: "On this day", u: `/on-this-day/#${day}`, s: "Everything United did on this date" });
  }
  return found;
}
