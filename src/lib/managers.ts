import managersJson from "../../data/club/managers.json";
import photosJson from "./manager-photos.json";

/**
 * Every manager, from data/club/managers.json (written and checked by scripts/build_managers.py).
 * Records come from Wikipedia's list and, from 2013 on, from our own match data. Photos are free-licensed pictures
 * from Wikimedia Commons in public/managers/, credited in manager-photos.json.
 */

export type Stint = { from: string; to: string; role: string | null; m: number; w: number; d: number; l: number; gf: number; ga: number; note: string | null; live: boolean };
export type Honour = { key: string; trophy: string; label: string; shared: boolean };
export type Manager = {
  name: string;
  slug: string;
  status: "manager" | "secretary-manager" | "player-manager" | "caretaker" | "interim" | "acting secretary";
  country: string | null;
  from: string;
  to: string;
  current: boolean;
  stints: Stint[];
  totals: { m: number; w: number; d: number; l: number; gf: number; ga: number };
  winPct: number | null;
  honours: Honour[];
  story: string | null;
};

export type ManagerPhoto = { src: string; shows: string; title: string; author: string; licence: string; licenceUrl: string; page: string };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const data = managersJson as unknown as { asOf: string; people: Manager[] };
type PhotoEntry = { name: string; shows: string; title: string; author: string; licence: string; licence_url: string; page: string };
const PHOTOS = photosJson as Record<string, PhotoEntry>;

export const MANAGERS = data.people;
export const AS_OF = data.asOf;

export function managerPhoto(slug: string): ManagerPhoto | null {
  const p = PHOTOS[slug];
  return p ? { src: `${BASE}/managers/${slug}.jpg`, shows: p.shows, title: p.title, author: p.author, licence: p.licence, licenceUrl: p.licence_url, page: p.page } : null;
}

export const STATUS_LABEL: Record<Manager["status"], string> = {
  manager: "Manager",
  "secretary-manager": "Secretary-manager",
  "player-manager": "Player-manager",
  caretaker: "Caretaker",
  interim: "Interim",
  "acting secretary": "Acting secretary",
};

/** Managers who were appointed to the job, as opposed to those who covered for someone. */
export const isPermanent = (m: Manager) => ["manager", "secretary-manager", "player-manager"].includes(m.status);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "1986-11-06" -> "6 Nov 1986"; "1958-02" -> "Feb 1958"; "1889" -> "1889"; "present" stays. */
export function when(d: string): string {
  if (d === "present") return "present";
  const [y, m, day] = d.split("-");
  if (!m) return y;
  return day ? `${parseInt(day, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}` : `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}
