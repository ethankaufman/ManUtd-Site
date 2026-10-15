import { cacheLife } from "next/cache";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";

/**
 * Everything the website reads from our database goes through this file.
 *
 * Each function is marked "use cache": Next.js remembers the answer instead of asking the
 * database on every visit. That keeps the site fast and the free database happy. Our data only
 * changes a few times a week, so remembering for hours is fine.
 */

export async function getTagline(): Promise<string> {
  "use cache";
  cacheLife("hours");
  const [row] = await db.select().from(schema.siteInfo).where(eq(schema.siteInfo.key, "tagline"));
  return row?.value ?? "Coming soon.";
}
