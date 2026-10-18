import { getMatchSeasons, getSeasonMatches } from "@/lib/data";
import { FINALS, TIMELINE } from "@/lib/club";
import { surname } from "@/lib/format";
import { UNITED, unitedResult, unitedView } from "@/lib/season";

/**
 * "On this day": everything in our data that happened on a calendar date, any year.
 *   * matches: every finished competitive match since 1992 (friendlies are not counted), from the match database
 *   * finals before 1992 (data/club/finals.json), and the dated entries of the history timeline (data/club/timeline.json)
 * Built once at build time into /on-this-day.json (see src/app/on-this-day.json/route.ts); the browser picks out the day.
 */

export type DayMatch = {
  kind: "match";
  date: string; // 2008-05-21
  season: string;
  comp: string; // "UEFA Champions League", "FA Cup final"
  round: string | null;
  opp: string;
  home: boolean | null; // null for a final at a neutral ground
  us: number;
  them: number;
  res: "W" | "D" | "L";
  pens: [number, number] | null; // shoot-out score, United first
  aet: boolean;
  venue: string | null;
  scorers: string[]; // United's goals
};
export type DayMoment = { kind: "moment"; date: string; title: string; text: string };
export type DayItem = DayMatch | DayMoment;
export type DayIndex = Record<string, DayItem[]>; // "02-06" -> newest first

const TZ = "Europe/London";
const dateOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ }).format(new Date(iso));
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function result(us: number, them: number): "W" | "D" | "L" {
  return us > them ? "W" : us < them ? "L" : "D";
}

export async function buildDayIndex(): Promise<DayIndex> {
  const days: DayIndex = {};
  const add = (item: DayItem) => {
    const key = item.date.slice(5);
    (days[key] ??= []).push(item);
  };

  // 1. every finished competitive match since 1992
  for (const season of await getMatchSeasons()) {
    const s = await getSeasonMatches(season);
    if (!s) continue;
    const kind = new Map(s.competitions.map((c) => [c.slug, c]));
    for (const m of s.matches) {
      const c = kind.get(m.competition);
      if (m.state !== "finished" || !c || c.kind === "friendly") continue;
      const v = unitedView(m);
      if (v.goalsFor === null || v.goalsAgainst === null) continue;
      add({
        kind: "match",
        date: dateOf(m.kickoff),
        season,
        comp: c.name,
        round: m.round || null,
        opp: v.opponent,
        home: v.home,
        us: v.goalsFor,
        them: v.goalsAgainst,
        res: unitedResult(m) ?? "D",
        pens: v.pensFor !== null && v.pensAgainst !== null ? [v.pensFor, v.pensAgainst] : null,
        aet: false,
        venue: m.venue ? [m.venue, m.city].filter(Boolean).join(", ") : null,
        scorers: m.goals
          .filter((g) => g.team === UNITED)
          .map((g) => `${g.player ? surname(g.player) : "Unknown"}${g.min ? ` ${g.min}'` : ""}${g.kind === "Penalty" ? " (pen)" : g.kind === "Own goal" ? " (own goal)" : ""}`),
      });
    }
  }

  // 2. the dated history timeline ("24 April 1909"); entries with only a year or a month cannot be placed on a day
  const momentDates = new Set<string>();
  for (const t of TIMELINE) {
    const m = t.when.match(/^(\d{1,2}) (\w+) (\d{4})$/);
    const month = m ? MONTHS.indexOf(m[2]) : -1;
    if (!m || month < 0) continue;
    const date = `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    momentDates.add(date);
    add({ kind: "moment", date, title: t.title, text: t.text });
  }

  // 3. finals (and replays) before 1992, unless the timeline already tells that day's story
  for (const f of FINALS) {
    const played = [{ date: f.date, venue: f.venue, score: f.score, aet: f.aet, pens: f.pens, label: f.replay ? "first match" : "" }];
    if (f.replay) played.push({ date: f.replay.date, venue: f.replay.venue, score: f.replay.score, aet: f.replay.aet, pens: f.replay.pens, label: f.replay.kind });
    for (const p of played) {
      if (p.date >= "1992-07-01" || momentDates.has(p.date)) continue;
      add({
        kind: "match",
        date: p.date,
        season: f.season,
        comp: f.comp_name,
        round: f.comp === "community-shield" ? p.label || null : p.label ? `Final, ${p.label}` : "Final",
        opp: f.opponent,
        home: null,
        us: p.score[0],
        them: p.score[1],
        res: result(p.score[0], p.score[1]),
        pens: p.pens,
        aet: p.aet,
        venue: p.venue,
        scorers: [],
      });
    }
  }

  for (const list of Object.values(days)) list.sort((a, b) => (a.date < b.date ? 1 : -1));
  return days;
}
