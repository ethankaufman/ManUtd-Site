import captainsJson from "../../data/club/captains.json";
import competitionsJson from "../../data/club/competitions.json";
import finalsJson from "../../data/club/finals.json";
import seasonsJson from "../../data/club/seasons.json";
import timelineJson from "../../data/club/timeline.json";

/**
 * The club's whole history, from the files in data/club/ (written by the scripts/import_*.py and build_*.py scripts).
 * These are small, fixed files, so they are read straight from disk rather than from the database.
 */

export type SeasonRow = {
  season: string; // "1998-99"
  club: string;
  division: string;
  promoted: boolean;
  relegated: boolean;
  tier: number | null;
  p: number | null;
  w: number | null;
  d: number | null;
  l: number | null;
  gf: number | null;
  ga: number | null;
  pts: number | null;
  pos: string; // "1st", or a dash when there was no league table
  fa_cup: string;
  league_cup: string;
  shield: string;
  europe: string[];
  notes: string[];
  scorers: string[];
  goals: number | null;
};

export type Final = {
  season: string;
  comp: string;
  comp_name: string;
  title: string;
  result: "Won" | "Lost" | "Shared";
  opponent: string;
  date: string;
  venue: string;
  city: string;
  score: [number, number]; // United first
  aet: boolean;
  attendance: number | null;
  referee: string;
  pens: [number, number] | null; // United first
  first_kind: string | null;
  replay: { kind: string; date: string; venue: string; city: string; score: [number, number]; aet: boolean; attendance: number | null; pens: [number, number] | null } | null;
  page: string;
};

export type CompetitionSummary = {
  name: string;
  first: string;
  last: string;
  seasons: number;
  titles: number;
  best?: string | null;
  finals?: number;
  shared?: number;
  note?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
};

export type Captain = { from: number; to: string; name: string; country: string | null; honours: string[] };
export type TimelineEntry = { when: string; title: string; text: string; sources: string[]; from_data: string[] };

export const SEASONS = seasonsJson as SeasonRow[];
export const FINALS = finalsJson as Final[];
export const COMPETITIONS = competitionsJson as unknown as {
  leagues: CompetitionSummary[];
  cups: CompetitionSummary[];
  europe: CompetitionSummary[];
  europeBan: { first: string; last: string; seasons: number } | null;
};
export const CAPTAINS = captainsJson as Captain[];
export const TIMELINE = timelineJson as TimelineEntry[];

/** "1998-99" -> 1990 (the decade the season began in) */
export const decadeOf = (season: string) => Math.floor(parseInt(season, 10) / 10) * 10;

/** The fixed part of a season id as shown to people: "1998–99". */
export const dashed = (season: string) => season.replace("-", "–");
