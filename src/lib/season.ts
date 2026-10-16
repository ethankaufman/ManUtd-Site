/**
 * Types and small helpers for the season pages. This file has NO database code, so the browser-side
 * components can import it safely (src/lib/data.ts is the one that talks to the database).
 */

export const UNITED = "Manchester United";

export type GoalEvent = { min: string; team: string | null; player: string | null; assist: string | null; kind: string };
export type CardEvent = { min: string; team: string | null; player: string | null; kind: string };

export type HubMatch = {
  id: string;
  competition: string; // competition slug
  round: string;
  kickoff: string; // ISO, UTC
  state: string;
  home: string;
  away: string;
  homeGoals: number | null;
  awayGoals: number | null;
  penHome: number | null;
  penAway: number | null;
  venue: string | null;
  city: string | null;
  attendance: number | null;
  note: string | null;
  goals: GoalEvent[];
  cards: CardEvent[];
};

export type TableRow = {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  zone: string | null;
};

export type HubCompetition = {
  slug: string;
  name: string;
  kind: string;
  status: string; // one plain sentence about where United stand in it
  table: TableRow[] | null;
  record: Record5 | null; // United's record in it (null if no matches yet)
};

export type Record5 = { played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number };
export type PlayerStat = { name: string; goals: number; assists: number; yellow: number; red: number };

export type SeasonHub = {
  season: string;
  updated: string | null;
  competitions: HubCompetition[];
  matches: HubMatch[]; // every match, in date order
  overall: Record5; // all competitions except pre-season friendlies
  players: PlayerStat[];
};

/** United's result in a match: "W", "D" or "L" (by the score, shoot-outs aside), or null if not finished. */
export function unitedResult(m: Pick<HubMatch, "state" | "home" | "homeGoals" | "awayGoals">): "W" | "D" | "L" | null {
  if (m.state !== "finished" || m.homeGoals === null || m.awayGoals === null) return null;
  const mine = m.home === UNITED ? m.homeGoals : m.awayGoals;
  const theirs = m.home === UNITED ? m.awayGoals : m.homeGoals;
  return mine > theirs ? "W" : mine < theirs ? "L" : "D";
}

/** United's side of a match, ready to read: goals for/against and who the opponent was. */
export function unitedView(m: HubMatch) {
  const home = m.home === UNITED;
  const goalsFor = home ? m.homeGoals : m.awayGoals;
  const goalsAgainst = home ? m.awayGoals : m.homeGoals;
  const pensFor = home ? m.penHome : m.penAway;
  const pensAgainst = home ? m.penAway : m.penHome;
  return { home, opponent: home ? m.away : m.home, goalsFor, goalsAgainst, pensFor, pensAgainst };
}

// ---------------------------------------------------------------------------------------------
// Squad and player pages
// ---------------------------------------------------------------------------------------------

export type Tally = { apps: number; starts: number; goals: number; assists: number; yellow: number; red: number };

export type SquadPlayer = {
  id: string;
  slug: string;
  name: string;
  number: string | null;
  position: string; // Goalkeeper | Defender | Midfielder | Forward
  age: number | null;
  dateOfBirth: string | null;
  nationality: string | null;
  heightCm: number | null;
  totals: Tally; // all competitions, not counting pre-season friendlies
};

/** One match as seen from one player: did they play, and what did they do. */
export type PlayerMatchLine = {
  matchId: string;
  kickoff: string;
  competition: string; // slug
  round: string;
  opponent: string;
  home: boolean;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: "W" | "D" | "L" | null;
  started: boolean;
  subbedOn: boolean;
  subbedOff: boolean;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
};

export type PlayerPage = SquadPlayer & {
  season: string;
  byCompetition: { slug: string; name: string; kind: string; tally: Tally }[];
  log: PlayerMatchLine[]; // matches they played in, newest first
};

export const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

export function emptyTally(): Tally {
  return { apps: 0, starts: 0, goals: 0, assists: 0, yellow: 0, red: 0 };
}
