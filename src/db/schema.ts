import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Database tables. Change the shape of the database ONLY here, then run
 *   npm run db:generate   (turns this file into a SQL migration in /drizzle)
 *   npm run db:migrate    (applies it)
 * Never hand-edit the files in /drizzle.
 */

/** Small key/value table for site-wide text, e.g. the homepage tagline. */
export const siteInfo = sqliteTable("site_info", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * A competition United play in during one season (Premier League, Champions League, a cup...).
 * `kind` is "league" | "europe" | "cup" | "friendly". `hasTable` says whether a league table is stored for it.
 */
export const competition = sqliteTable(
  "competition",
  {
    season: text("season").notNull(), // e.g. "2026-27"
    slug: text("slug").notNull(), // e.g. "premier-league"
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    hasTable: integer("has_table", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.slug] })],
);

/**
 * One United match, played or still to come. `detail` is a JSON text with goals, cards and line-ups
 * (only for finished matches); the site's pages read it through src/lib/data.ts.
 */
export const match = sqliteTable("match", {
  id: text("id").primaryKey(), // the data provider's match id
  season: text("season").notNull(),
  competition: text("competition").notNull(), // slug of the competition
  round: text("round").notNull().default(""),
  kickoff: text("kickoff").notNull(), // ISO time in UTC, e.g. 2026-10-18T13:00Z
  state: text("state").notNull(), // "scheduled" | "live" | "finished" | "postponed"
  home: text("home").notNull(),
  away: text("away").notNull(),
  homeGoals: integer("home_goals"),
  awayGoals: integer("away_goals"),
  penHome: integer("pen_home"), // penalty shoot-out score, if there was one
  penAway: integer("pen_away"),
  venue: text("venue"),
  city: text("city"),
  attendance: integer("attendance"),
  neutral: integer("neutral", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  detail: text("detail"),
});

/** A row of a league table (Premier League, or the Champions League league phase). */
export const standing = sqliteTable(
  "standing",
  {
    season: text("season").notNull(),
    competition: text("competition").notNull(),
    rank: integer("rank").notNull(),
    team: text("team").notNull(),
    played: integer("played").notNull(),
    won: integer("won").notNull(),
    drawn: integer("drawn").notNull(),
    lost: integer("lost").notNull(),
    goalsFor: integer("goals_for").notNull(),
    goalsAgainst: integer("goals_against").notNull(),
    points: integer("points").notNull(),
    zone: text("zone"), // e.g. "Champions League", "Relegation"
  },
  (t) => [primaryKey({ columns: [t.season, t.competition, t.team] })],
);
