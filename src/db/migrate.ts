import { migrate } from "drizzle-orm/libsql/migrator";

import { createDb, schema } from "./index";

/** Applies the SQL files in /drizzle to the database, then makes sure the homepage tagline exists. */
async function main() {
  const db = createDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db
    .insert(schema.siteInfo)
    .values({ key: "tagline", value: "Every match. Every trophy. Every legend." })
    .onConflictDoNothing();
  console.log("Database is up to date.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
