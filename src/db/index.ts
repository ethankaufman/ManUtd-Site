import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

/**
 * Database access for the whole app.
 *
 *   import { db, schema } from "@/db";
 *   const rows = await db.select().from(schema.siteInfo);
 *
 * Locally this is a SQLite file (data/app.db). In production it is Turso
 * (hosted libsql): set DATABASE_URL (and DATABASE_AUTH_TOKEN) and nothing else changes.
 */

export const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/app.db";

/** libsql won't create the folder for a `file:` URL, so make sure it exists. */
function ensureParentDir(url: string): void {
  if (url.startsWith("file:")) {
    mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
  }
}

/** Build a fresh Drizzle instance. Also used by scripts (migrate, ingest). */
export function createDb(url: string = DATABASE_URL) {
  ensureParentDir(url);
  const client: Client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  return drizzle(client, { schema });
}

// In dev, Next reloads modules on every edit; reuse one client to avoid leaks.
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof createDb> };
export const db = globalForDb.__db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export { schema };
