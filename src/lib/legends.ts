import legendsJson from "../../data/club/legends.json";
import storiesJson from "../../data/club/legend_stories.json";
import photosJson from "./legend-photos.json";

/**
 * The legends: record at United (Wikipedia's 100+ appearances list), trophies (each player's Wikipedia honours
 * section, every entry verified against our own trophy data), individual awards (our awards data), the story
 * (written from Wikipedia's articles) and a free-licensed portrait from Wikimedia Commons.
 * Built by scripts/import_legends.py and build_legends.py.
 */

export type LegendTrophy = { key: string; trophy: string; label: string; shared: boolean };
export type LegendAward = { label: string; season: string; detail: string };
export type Legend = {
  slug: string;
  name: string;
  wikipedia: string;
  nation: string | null;
  pos: string | null;
  spells: string[]; // e.g. ["1994–2011", "2012–2013"]
  starts: number;
  subs: number;
  apps: number;
  goals: number;
  trophies: LegendTrophy[];
  youthHonours: { text: string }[];
  awards: LegendAward[];
  tagline: string;
  story: string[];
  photo: { src: string; shows: string; author: string; licence: string; licenceUrl: string; page: string } | null;
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
type Raw = Omit<Legend, "slug" | "nation" | "tagline" | "story" | "photo"> & { nation: string | null };
type PhotoEntry = { shows: string; title: string; author: string; licence: string; licence_url: string; page: string };
const STORIES = storiesJson as Record<string, { tagline: string; story: string[] }>;
const PHOTOS = photosJson as Record<string, PhotoEntry>;

export const LEGENDS: Legend[] = Object.entries(legendsJson as unknown as Record<string, Raw & { nation?: string | null }>).map(([slug, r]) => {
  const p = PHOTOS[slug];
  return {
    ...r,
    slug,
    nation: r.nation ?? null,
    tagline: STORIES[slug].tagline,
    story: STORIES[slug].story,
    photo: p ? { src: `${BASE}/legends/${slug}.jpg`, shows: p.shows, author: p.author, licence: p.licence, licenceUrl: p.licence_url, page: p.page } : null,
  };
});

export const legendBySlug = (slug: string) => LEGENDS.find((l) => l.slug === slug) ?? null;

const NATIONS: Record<string, string> = { ENG: "England", SCO: "Scotland", WAL: "Wales", NIR: "Northern Ireland", IRL: "Republic of Ireland", DEN: "Denmark", FRA: "France", NOR: "Norway", POR: "Portugal", NED: "Netherlands", SCG: "Serbia" };
const POSITIONS: Record<string, string> = { GK: "Goalkeeper", FB: "Full-back", HB: "Half-back", DF: "Defender", MF: "Midfielder", FW: "Forward", U: "Utility player" };
export const nationName = (c: string | null) => (c ? (NATIONS[c] ?? c) : "");
export const positionName = (p: string | null) => (p ? (POSITIONS[p] ?? p) : "");

/** "1994–2011" -> "1994–2011"; the second year is kept in full: spells are short strings already. */
export const spellText = (spells: string[]) => spells.map((s) => s.replace(/^(\d{2})(\d{2})–(\d{2})(\d{2})$/, (_m, a, b, c, d) => (a === c ? `${a}${b}–${d}` : s))).join(" and ");

/** About how many years the player was at United, from the years of his spells. */
export function yearsAtClub(spells: string[]): number {
  return spells.reduce((n, s) => {
    const [a, b] = s.split("–").map((x) => parseInt(x, 10));
    return n + Math.max(1, (b ?? a) - a);
  }, 0);
}

export const firstYear = (l: Legend) => parseInt(l.spells[0], 10);

/** The legends in era groups for the index page. */
export const ERAS: { title: string; test: (l: Legend) => boolean }[] = [
  { title: "The 1950s and 1960s", test: (l) => firstYear(l) < 1970 },
  { title: "The 1980s", test: (l) => firstYear(l) >= 1970 && firstYear(l) < 1990 },
  { title: "The 1990s", test: (l) => firstYear(l) >= 1990 && firstYear(l) < 2000 },
  { title: "The 2000s and 2010s", test: (l) => firstYear(l) >= 2000 },
];

/** Trophies grouped by competition, in the order they appear. */
export function groupTrophies(t: LegendTrophy[]) {
  const groups: { trophy: string; items: { label: string; shared: boolean }[] }[] = [];
  for (const x of t) {
    let g = groups.find((y) => y.trophy === x.trophy);
    if (!g) groups.push((g = { trophy: x.trophy, items: [] }));
    g.items.push({ label: x.label, shared: x.shared });
  }
  return groups;
}
