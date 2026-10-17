/** Small helpers for showing dates and goals. Times are always shown in UK time so the page reads the same everywhere. */

const TZ = "Europe/London";

export function dayLabel(iso: string, withYear = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: withYear ? "numeric" : undefined,
    timeZone: TZ,
  }).format(new Date(iso));
}

export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

export function longDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(new Date(iso));
}

/** "Bruno Fernandes" -> "Fernandes"; keeps short double names like "van de Ven" together. */
export function surname(full: string | null): string {
  if (!full) return "Unknown";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const particles = new Set(["van", "de", "der", "den", "da", "dos", "di", "le", "la", "von", "el", "al"]);
  let i = parts.length - 1;
  while (i > 1 && particles.has(parts[i - 1].toLowerCase())) i--;
  return parts.slice(i).join(" ");
}

/** "2008-09" -> "2008–09" (a proper dash for display). */
export function seasonLabel(season: string): string {
  return season.replace("-", "–");
}
