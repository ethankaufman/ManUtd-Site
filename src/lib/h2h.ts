import type { DayIndex, DayMatch } from "@/lib/onthisday";

/**
 * Head to head: United's record against one opponent, worked out in the browser from the same match index the
 * "On this day" page uses (every finished competitive match since 1992-93; friendlies are not counted).
 * A match decided on penalties counts as a draw, like everywhere else on the site.
 */

export const FIRST_SEASON = "1992-93";

/** Quick picks shown above the full list (only those United have actually played are shown). */
export const RIVALS = ["Liverpool", "Manchester City", "Arsenal", "Chelsea", "Leeds United", "Tottenham Hotspur", "Newcastle United", "Everton"];

export const slugOf = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type Group = "League" | "FA Cup" | "League Cup" | "Europe" | "Community Shield" | "World";
export const GROUPS: Group[] = ["League", "FA Cup", "League Cup", "Europe", "Community Shield", "World"];

export function groupOf(comp: string): Group {
  if (comp === "Premier League") return "League";
  if (comp === "FA Cup") return "FA Cup";
  if (comp === "League Cup") return "League Cup";
  if (/Community Shield|Charity Shield/.test(comp)) return "Community Shield";
  if (/^UEFA/.test(comp)) return "Europe";
  return "World"; // Intercontinental Cup, FIFA Club World Cup / Championship
}

export type Tally = { p: number; w: number; d: number; l: number; gf: number; ga: number };
const empty = (): Tally => ({ p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
function add(t: Tally, m: DayMatch) {
  t.p++;
  t.gf += m.us;
  t.ga += m.them;
  if (m.us > m.them) t.w++;
  else if (m.us < m.them) t.l++;
  else t.d++;
}

export type Opponent = { name: string; slug: string; matches: DayMatch[] }; // matches newest first

/** Every club United have played in a competitive match since 1992-93, A to Z. */
export function opponentsFrom(index: DayIndex): Opponent[] {
  const by = new Map<string, DayMatch[]>();
  for (const items of Object.values(index)) {
    for (const it of items) {
      if (it.kind !== "match" || it.season < FIRST_SEASON) continue; // earlier finals are not part of the full record
      (by.get(it.opp) ?? by.set(it.opp, []).get(it.opp)!).push(it);
    }
  }
  return [...by.entries()]
    .map(([name, matches]) => ({ name, slug: slugOf(name), matches: matches.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export type Summary = {
  total: Tally;
  home: Tally;
  away: Tally;
  neutral: Tally;
  byGroup: { group: Group; t: Tally }[];
  biggestWin: DayMatch | null;
  heaviestDefeat: DayMatch | null;
  first: DayMatch;
  last: DayMatch;
  form: DayMatch[]; // last five, newest first
  scorers: { name: string; goals: number }[]; // United's top scorers against them, by surname
  ownGoals: number; // goals they put into their own net
  shootouts: { won: number; lost: number };
};

const goalDiff = (m: DayMatch) => m.us - m.them;

export function summarise(matches: DayMatch[]): Summary {
  const total = empty();
  const home = empty();
  const away = empty();
  const neutral = empty();
  const groups = new Map<Group, Tally>();
  let biggestWin: DayMatch | null = null;
  let heaviestDefeat: DayMatch | null = null;
  const scorers = new Map<string, number>();
  let ownGoals = 0;
  const shootouts = { won: 0, lost: 0 };
  // newest first, so on a tie the more recent match is kept
  for (const m of matches) {
    add(total, m);
    add(m.home === true ? home : m.home === false ? away : neutral, m);
    const g = groupOf(m.comp);
    add(groups.get(g) ?? groups.set(g, empty()).get(g)!, m);
    if (goalDiff(m) > 0 && (!biggestWin || goalDiff(m) > goalDiff(biggestWin) || (goalDiff(m) === goalDiff(biggestWin) && m.us > biggestWin.us))) biggestWin = m;
    if (goalDiff(m) < 0 && (!heaviestDefeat || goalDiff(m) < goalDiff(heaviestDefeat) || (goalDiff(m) === goalDiff(heaviestDefeat) && m.them > heaviestDefeat.them))) heaviestDefeat = m;
    if (m.pens && m.pens[0] > m.pens[1]) shootouts.won++;
    else if (m.pens) shootouts.lost++;
    for (const s of m.scorers) {
      if (s.includes("(own goal)")) {
        ownGoals++;
        continue;
      }
      const name = s.replace(/ \d+(\+\d+)?'.*$/, "");
      scorers.set(name, (scorers.get(name) ?? 0) + 1);
    }
  }
  return {
    total,
    home,
    away,
    neutral,
    byGroup: GROUPS.filter((g) => groups.has(g)).map((g) => ({ group: g, t: groups.get(g)! })),
    biggestWin,
    heaviestDefeat,
    first: matches[matches.length - 1],
    last: matches[0],
    form: matches.slice(0, 5),
    scorers: [...scorers.entries()].map(([name, goals]) => ({ name, goals })).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 5),
    ownGoals,
    shootouts,
  };
}
