import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { eq } from "drizzle-orm";

import { createDb, schema } from "./index";

/**
 * Loads the season files in data/season/*.json (written by scripts/update_season.py) into the database.
 * Safe to run again and again: each season's rows are replaced, so the database always matches the files.
 */

type SeasonFile = {
  season: string;
  updated: string;
  source: string;
  competitions: { slug: string; name: string; kind: string; has_table: boolean }[];
  squad?: { id: string; slug: string; name: string; no: string | null; pos: string | null; age: number | null; dob: string | null; nation: string | null; height_cm: number | null }[];
  tables: Record<string, { rank: number; team: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; zone: string | null }[]>;
  matches: {
    id: string;
    espn: string;
    comp: string;
    round: string;
    kick: string;
    state: string;
    home: string;
    away: string;
    hg: number | null;
    ag: number | null;
    pens: [number, number] | null;
    venue: string | null;
    city: string | null;
    att: number | null;
    neutral: boolean;
    note: string | null;
    goals?: unknown[];
    cards?: unknown[];
    lineups?: unknown[];
  }[];
};

async function main() {
  const db = createDb();
  const dir = join(process.cwd(), "data", "season");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const data: SeasonFile = JSON.parse(readFileSync(join(dir, file), "utf8"));
    const season = data.season;
    const codeToSlug = new Map(data.competitions.map((c) => [c.slug, c.slug]));

    // which ESPN table belongs to which competition slug
    const tableSlug: Record<string, string> = { "eng.1": "premier-league", "uefa.champions": "champions-league" };

    await db.transaction(async (tx) => {
      await tx.delete(schema.standing).where(eq(schema.standing.season, season));
      await tx.delete(schema.match).where(eq(schema.match.season, season));
      await tx.delete(schema.competition).where(eq(schema.competition.season, season));
      await tx.delete(schema.squadMember).where(eq(schema.squadMember.season, season));

      await tx.insert(schema.competition).values(
        data.competitions.map((c, i) => ({ season, slug: c.slug, name: c.name, kind: c.kind, hasTable: c.has_table, sortOrder: i })),
      );

      for (const [code, rows] of Object.entries(data.tables)) {
        const slug = tableSlug[code];
        if (!slug || !codeToSlug.has(slug)) continue;
        await tx.insert(schema.standing).values(
          rows.map((r) => ({
            season,
            competition: slug,
            rank: r.rank,
            team: r.team,
            played: r.p,
            won: r.w,
            drawn: r.d,
            lost: r.l,
            goalsFor: r.gf,
            goalsAgainst: r.ga,
            points: r.pts,
            zone: r.zone,
          })),
        );
      }

      // insert matches in small batches (SQLite limits how many values one statement can carry)
      for (let i = 0; i < data.matches.length; i += 10) {
        await tx.insert(schema.match).values(
          data.matches.slice(i, i + 10).map((m) => ({
            id: m.id,
            season,
            competition: m.comp,
            round: m.round,
            kickoff: m.kick,
            state: m.state,
            home: m.home,
            away: m.away,
            homeGoals: m.hg,
            awayGoals: m.ag,
            penHome: m.pens?.[0] ?? null,
            penAway: m.pens?.[1] ?? null,
            venue: m.venue,
            city: m.city,
            attendance: m.att,
            neutral: m.neutral,
            note: m.note,
            detail: m.goals ? JSON.stringify({ goals: m.goals, cards: m.cards ?? [], lineups: m.lineups ?? [] }) : null,
          })),
        );
      }

      if (data.squad?.length) {
        await tx.insert(schema.squadMember).values(
          data.squad.map((p) => ({
            season,
            id: p.id,
            slug: p.slug,
            name: p.name,
            shirtNumber: p.no,
            position: p.pos,
            age: p.age,
            dateOfBirth: p.dob,
            nationality: p.nation,
            heightCm: p.height_cm,
          })),
        );
      }

      await tx
        .insert(schema.siteInfo)
        .values({ key: `season:${season}:updated`, value: data.updated })
        .onConflictDoUpdate({ target: schema.siteInfo.key, set: { value: data.updated } });
    });
    console.log(`Loaded ${season}: ${data.matches.length} matches, ${Object.keys(data.tables).length} tables, ${data.squad?.length ?? 0} players.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
