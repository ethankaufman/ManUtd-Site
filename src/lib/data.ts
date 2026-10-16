import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";

/**
 * Everything the website reads from our database goes through this file.
 *
 * The site is built into plain HTML files (see next.config.ts), so these functions run once,
 * during `npm run build`, and the answers are baked into the pages. Visitors never touch the database.
 */

export async function getTagline(): Promise<string> {
  const [row] = await db.select().from(schema.siteInfo).where(eq(schema.siteInfo.key, "tagline"));
  return row?.value ?? "Coming soon.";
}

// ---------------------------------------------------------------------------------------------
// The season hub: every competition United play in during one season.
// ---------------------------------------------------------------------------------------------

export * from "./season";
import { UNITED, unitedResult, unitedView } from "./season";
import type { CardEvent, GoalEvent, HubCompetition, HubMatch, PlayerStat, Record5, SeasonHub, TableRow } from "./season";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const ZONE_TEXT: Record<string, string> = {
  "Qualifies for round of 16": "in the top eight, which goes straight to the round of 16",
  "Knockout phase playoffs - seeded": "in the seeded playoff places",
  "Knockout phase playoffs - unseeded": "in the unseeded playoff places",
  Eliminated: "in the elimination places",
};

function recordOf(ms: HubMatch[]): Record5 {
  const r: Record5 = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
  for (const m of ms) {
    const res = unitedResult(m);
    if (!res) continue;
    const v = unitedView(m);
    r.played++;
    r.goalsFor += v.goalsFor ?? 0;
    r.goalsAgainst += v.goalsAgainst ?? 0;
    if (res === "W") r.won++;
    else if (res === "D") r.drawn++;
    else r.lost++;
  }
  return r;
}

function describeStatus(
  c: { slug: string; name: string; kind: string },
  ms: HubMatch[],
  table: TableRow[] | null,
): string {
  const played = ms.filter((m) => m.state === "finished");
  const upcoming = ms.filter((m) => m.state === "scheduled");
  const row = table?.find((r) => r.team === UNITED);

  if (c.kind === "friendly") return `${played.length} pre-season matches played.`;
  if (!ms.length) {
    return c.slug === "fa-cup" ? "Not started yet. United join the FA Cup in the third round, in January." : "Not started yet.";
  }
  if (row && table) {
    const where = `${ordinal(row.rank)} of ${table.length} with ${row.points} point${row.points === 1 ? "" : "s"} from ${row.played} game${row.played === 1 ? "" : "s"}`;
    const zone = row.zone && ZONE_TEXT[row.zone] ? `, ${ZONE_TEXT[row.zone]}` : "";
    return `${where}${zone}.`;
  }
  if (c.kind === "cup") {
    const last = played[played.length - 1];
    if (last && !upcoming.length) {
      const v = unitedView(last);
      const res = unitedResult(last);
      const lostOnPens = res === "D" && v.pensFor !== null && v.pensAgainst !== null && v.pensFor < v.pensAgainst;
      if (res === "L" || lostOnPens) {
        return `Knocked out in the ${last.round.toLowerCase()}, losing ${v.goalsFor}–${v.goalsAgainst} ${v.home ? "at home to" : "away to"} ${v.opponent}.`;
      }
    }
    if (upcoming.length) return `Still in. Next: ${upcoming[0].round}.`;
  }
  return `${played.length} played, ${upcoming.length} to come.`;
}

/** Everything the "This Season" page needs, for the newest season in the database. */
export async function getSeasonHub(): Promise<SeasonHub | null> {
  const [latest] = await db.select({ season: schema.match.season }).from(schema.match).orderBy(desc(schema.match.season)).limit(1);
  if (!latest) return null;
  const season = latest.season;

  const comps = await db.select().from(schema.competition).where(eq(schema.competition.season, season)).orderBy(schema.competition.sortOrder);
  const matchRows = await db.select().from(schema.match).where(eq(schema.match.season, season)).orderBy(schema.match.kickoff);
  const standings = await db.select().from(schema.standing).where(eq(schema.standing.season, season)).orderBy(schema.standing.rank);
  const [upd] = await db.select().from(schema.siteInfo).where(eq(schema.siteInfo.key, `season:${season}:updated`));

  const matches: HubMatch[] = matchRows.map((m) => {
    const detail = m.detail ? (JSON.parse(m.detail) as { goals: GoalEvent[]; cards: CardEvent[] }) : { goals: [], cards: [] };
    return {
      id: m.id,
      competition: m.competition,
      round: m.round,
      kickoff: m.kickoff,
      state: m.state,
      home: m.home,
      away: m.away,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      penHome: m.penHome,
      penAway: m.penAway,
      venue: m.venue,
      city: m.city,
      attendance: m.attendance,
      note: m.note,
      goals: detail.goals,
      cards: detail.cards,
    };
  });

  const competitions: HubCompetition[] = comps.map((c) => {
    const ms = matches.filter((m) => m.competition === c.slug);
    const table: TableRow[] | null = c.hasTable
      ? standings
          .filter((s) => s.competition === c.slug)
          .map((s) => ({ rank: s.rank, team: s.team, played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, goalsFor: s.goalsFor, goalsAgainst: s.goalsAgainst, points: s.points, zone: s.zone }))
      : null;
    const hasTable = table && table.length ? table : null;
    return {
      slug: c.slug,
      name: c.name,
      kind: c.kind,
      status: describeStatus(c, ms, hasTable),
      table: hasTable,
      record: ms.some((m) => m.state === "finished") ? recordOf(ms) : null,
    };
  });

  // player stats across every real competition (pre-season friendlies are left out)
  const friendly = new Set(comps.filter((c) => c.kind === "friendly").map((c) => c.slug));
  const real = matches.filter((m) => !friendly.has(m.competition));
  const people = new Map<string, PlayerStat>();
  const person = (name: string) => {
    if (!people.has(name)) people.set(name, { name, goals: 0, assists: 0, yellow: 0, red: 0 });
    return people.get(name)!;
  };
  for (const m of real) {
    for (const g of m.goals) {
      if (g.team !== UNITED || g.kind === "Own goal") continue;
      if (g.player) person(g.player).goals++;
      if (g.assist) person(g.assist).assists++;
    }
    for (const c of m.cards) {
      if (c.team !== UNITED || !c.player) continue;
      if (c.kind === "Yellow") person(c.player).yellow++;
      else person(c.player).red++;
    }
  }

  return {
    season,
    updated: upd?.value ?? null,
    competitions,
    matches,
    overall: recordOf(real),
    players: [...people.values()],
  };
}
