import honoursJson from "../../data/club/honours.json";
import photosJson from "./trophy-photos.json";

/**
 * Trophies and individual awards, from data/club/honours.json (written and checked by scripts/build_honours.py).
 * Trophy photos are free-licensed pictures from Wikimedia Commons (public/trophies/), credited in trophy-photos.json.
 */

export type FinalInfo = {
  date: string;
  opponent: string;
  score: [number, number]; // United first
  aet: boolean;
  pens: [number, number] | null;
  venue: string;
  city: string;
  attendance: number | null;
  replay: { kind: string; date: string; venue: string; city: string; score: [number, number]; aet: boolean; pens: [number, number] | null } | null;
  page: string;
  title: string;
};

export type Win = {
  season: string; // "1998-99"
  year: number;
  label: string; // how Wikipedia labels it: "1998–99" or, for one-off matches, "1998"
  shared: boolean;
  final: FinalInfo | null;
  table: { p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number } | null;
};

export type Trophy = { key: string; name: string; type: "league" | "cup" | "europe"; entries: Win[] };
export type Award = { award: string; label: string; season: string; winner: string; detail: string };
export type BallonDor = { year: number; player: string; club: string };

export type TrophyPhoto = { src: string; shows: string; title: string; author: string; licence: string; licenceUrl: string; page: string };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const data = honoursJson as unknown as { trophies: Trophy[]; awards: Award[]; ballonDor: BallonDor[] };
type PhotoEntry = { file: string; shows: string; title: string; author: string; licence: string; licence_url: string; page: string };
const PHOTOS = photosJson as Record<string, PhotoEntry>;

export const TROPHIES = data.trophies;
export const AWARDS = data.awards;
export const BALLON_DOR = data.ballonDor;

export function trophyPhoto(key: string): TrophyPhoto | null {
  const p = PHOTOS[key];
  if (!p) return null;
  return { src: `${BASE}/trophies/${p.file}`, shows: p.shows, title: p.title, author: p.author, licence: p.licence, licenceUrl: p.licence_url, page: p.page };
}

/** The Premier League era starts with the 1992–93 season (so the 1991–92 League Cup is not counted). */
export const SINCE_1992 = "1992-93";
export const inPeriod = (season: string, since1992: boolean) => !since1992 || season >= SINCE_1992;

export const GROUPS: { title: string; type: Trophy["type"] }[] = [
  { title: "The league", type: "league" },
  { title: "The cups at home", type: "cup" },
  { title: "Europe and the world", type: "europe" },
];
