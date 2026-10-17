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
import { POSITION_ORDER, emptyTally } from "./season";
import type { CardEvent, FullMatch, GoalEvent, HubCompetition, HubMatch, Lineup as MatchLineup, SeasonBrowse, PlayerMatchLine, PlayerPage, PlayerStat, Record5, SeasonHub, SquadPlayer, Tally, TableRow } from "./season";

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

// ---------------------------------------------------------------------------------------------
// Squad and player pages
// ---------------------------------------------------------------------------------------------

type Lineup = { team: string; players: { id: string | null; name: string | null; start: boolean; on: boolean; off: boolean }[] };

/** Works out every squad member's matches and numbers for the newest season, from the stored match details. */
async function loadSquad() {
  const [latest] = await db.select({ season: schema.squadMember.season }).from(schema.squadMember).orderBy(desc(schema.squadMember.season)).limit(1);
  if (!latest) return null;
  const season = latest.season;
  const members = await db.select().from(schema.squadMember).where(eq(schema.squadMember.season, season));
  const comps = await db.select().from(schema.competition).where(eq(schema.competition.season, season)).orderBy(schema.competition.sortOrder);
  const rows = await db.select().from(schema.match).where(eq(schema.match.season, season)).orderBy(desc(schema.match.kickoff));

  const lines = new Map<string, PlayerMatchLine[]>(); // by player id
  for (const m of rows) {
    if (m.state !== "finished" || !m.detail) continue;
    const detail = JSON.parse(m.detail) as { goals: GoalEvent[]; cards: CardEvent[]; lineups: Lineup[] };
    const home = m.home === UNITED;
    const view = unitedView({ home: m.home, away: m.away, homeGoals: m.homeGoals, awayGoals: m.awayGoals, penHome: m.penHome, penAway: m.penAway } as HubMatch);
    const res = unitedResult({ state: m.state, home: m.home, homeGoals: m.homeGoals, awayGoals: m.awayGoals });
    const ours = detail.lineups.find((l) => l.team === UNITED);
    for (const p of ours?.players ?? []) {
      if (!p.id || !(p.start || p.on)) continue;
      const mine = (e: { team: string | null; player: string | null }) => e.team === UNITED && e.player === p.name;
      const line: PlayerMatchLine = {
        matchId: m.id,
        kickoff: m.kickoff,
        competition: m.competition,
        round: m.round,
        opponent: view.opponent,
        home,
        goalsFor: view.goalsFor,
        goalsAgainst: view.goalsAgainst,
        result: res,
        started: p.start,
        subbedOn: p.on,
        subbedOff: p.off,
        goals: detail.goals.filter((g) => mine(g) && g.kind !== "Own goal").length,
        assists: detail.goals.filter((g) => g.team === UNITED && g.assist === p.name && g.kind !== "Own goal").length,
        yellow: detail.cards.filter((c) => mine(c) && c.kind === "Yellow").length,
        red: detail.cards.filter((c) => mine(c) && c.kind !== "Yellow").length,
      };
      lines.set(p.id, [...(lines.get(p.id) ?? []), line]);
    }
  }
  return { season, members, comps, lines };
}

function tallyOf(lines: PlayerMatchLine[]): Tally {
  const t = emptyTally();
  for (const l of lines) {
    t.apps++;
    if (l.started) t.starts++;
    t.goals += l.goals;
    t.assists += l.assists;
    t.yellow += l.yellow;
    t.red += l.red;
  }
  return t;
}

function toSquadPlayer(
  m: typeof schema.squadMember.$inferSelect,
  lines: PlayerMatchLine[],
  friendly: Set<string>,
): SquadPlayer {
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    number: m.shirtNumber,
    position: m.position ?? "Midfielder",
    age: m.age,
    dateOfBirth: m.dateOfBirth,
    nationality: m.nationality,
    heightCm: m.heightCm,
    totals: tallyOf(lines.filter((l) => !friendly.has(l.competition))),
  };
}

/** The whole first-team squad, in position order and then shirt-number order. */
export async function getSquad(): Promise<{ season: string; players: SquadPlayer[] } | null> {
  const data = await loadSquad();
  if (!data) return null;
  const friendly = new Set(data.comps.filter((c) => c.kind === "friendly").map((c) => c.slug));
  const players = data.members
    .map((m) => toSquadPlayer(m, data.lines.get(m.id) ?? [], friendly))
    .sort((a, b) => {
      const pa = POSITION_ORDER.indexOf(a.position);
      const pb = POSITION_ORDER.indexOf(b.position);
      return pa - pb || (parseInt(a.number ?? "999", 10) || 999) - (parseInt(b.number ?? "999", 10) || 999) || a.name.localeCompare(b.name);
    });
  return { season: data.season, players };
}

export async function getPlayerSlugs(): Promise<string[]> {
  const squad = await getSquad();
  return squad ? squad.players.map((p) => p.slug) : [];
}

export async function getPlayer(slug: string): Promise<PlayerPage | null> {
  const data = await loadSquad();
  const member = data?.members.find((m) => m.slug === slug);
  if (!data || !member) return null;
  const friendly = new Set(data.comps.filter((c) => c.kind === "friendly").map((c) => c.slug));
  const lines = data.lines.get(member.id) ?? [];
  return {
    ...toSquadPlayer(member, lines, friendly),
    season: data.season,
    byCompetition: data.comps
      .map((c) => ({ slug: c.slug, name: c.name, kind: c.kind, tally: tallyOf(lines.filter((l) => l.competition === c.slug)) }))
      .filter((c) => c.tally.apps > 0),
    log: lines, // already newest first
  };
}

// ---------------------------------------------------------------------------------------------
// Every Match
// ---------------------------------------------------------------------------------------------

/** Every season we hold matches for, newest first. */
export async function getMatchSeasons(): Promise<string[]> {
  const rows = await db.selectDistinct({ season: schema.match.season }).from(schema.match).orderBy(desc(schema.match.season));
  return rows.map((r) => r.season);
}

/** All matches of one season with full detail, plus the season's competitions and headline numbers. */
export async function getSeasonMatches(season: string): Promise<SeasonBrowse | null> {
  const rows = await db.select().from(schema.match).where(eq(schema.match.season, season)).orderBy(schema.match.kickoff);
  if (!rows.length) return null;
  const comps = await db.select().from(schema.competition).where(eq(schema.competition.season, season)).orderBy(schema.competition.sortOrder);
  const standings = await db
    .select()
    .from(schema.standing)
    .where(eq(schema.standing.season, season))
    .orderBy(schema.standing.rank);

  const matches: FullMatch[] = rows.map((m) => {
    const d = m.detail
      ? (JSON.parse(m.detail) as { goals: GoalEvent[]; cards: CardEvent[]; lineups?: MatchLineup[]; incomplete?: boolean; src?: string })
      : { goals: [], cards: [], lineups: [], incomplete: true, src: "espn" };
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
      goals: d.goals,
      cards: d.cards,
      lineups: d.lineups ?? [],
      incomplete: d.incomplete ?? false,
      source: d.src === "wikipedia" ? "wikipedia" : "espn",
    };
  });

  const record = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
  const friendly = new Set(comps.filter((c) => c.kind === "friendly").map((c) => c.slug));
  for (const m of matches) {
    if (m.state !== "finished" || friendly.has(m.competition)) continue;
    const v = unitedView(m);
    record.played++;
    record.goalsFor += v.goalsFor ?? 0;
    record.goalsAgainst += v.goalsAgainst ?? 0;
    const r = unitedResult(m);
    if (r === "W") record.won++;
    else if (r === "D") record.drawn++;
    else if (r === "L") record.lost++;
  }

  const league = standings.filter((s) => s.competition === "premier-league");
  const mine = league.find((s) => s.team === UNITED);
  return {
    season,
    competitions: comps.map((c) => ({ slug: c.slug, name: c.name, kind: c.kind, count: matches.filter((m) => m.competition === c.slug).length })),
    matches,
    leagueFinish: mine ? { rank: mine.rank, points: mine.points, of: league.length } : null,
    record,
  };
}
