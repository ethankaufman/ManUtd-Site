import { sqliteTable, text } from "drizzle-orm/sqlite-core";

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
