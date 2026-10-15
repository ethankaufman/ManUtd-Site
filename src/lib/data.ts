import { eq } from "drizzle-orm";

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
