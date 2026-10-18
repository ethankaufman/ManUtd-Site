import credits from "./player-photos.json";

/**
 * Free-licensed photos of squad members (Wikimedia Commons), saved in public/players/<slug>.jpg.
 * Written by scripts/fetch_player_photos.py. A player without an entry simply has no photo.
 */
export type PlayerPhoto = {
  src: string;
  title: string; // the Commons file name
  author: string;
  licence: string;
  licenceUrl: string;
  page: string; // the photo's Commons page
  shows: string | null; // what the picture shows, e.g. "In United kit against Norwich City, 16 April 2022"
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
type Entry = { title: string; author: string; licence: string; licence_url: string; page: string; shows?: string };
const ENTRIES = credits as Record<string, Entry>;

export function playerPhoto(slug: string): PlayerPhoto | null {
  const c = ENTRIES[slug];
  if (!c) return null;
  return { src: `${BASE}/players/${slug}.jpg`, title: c.title.replace(/_/g, " "), author: c.author, licence: c.licence, licenceUrl: c.licence_url, page: c.page, shows: c.shows ?? null };
}

/** Every photo with its credit, for the credits list. */
export function allPlayerPhotos(): { slug: string; photo: PlayerPhoto }[] {
  return Object.keys(ENTRIES).map((slug) => ({ slug, photo: playerPhoto(slug)! }));
}
