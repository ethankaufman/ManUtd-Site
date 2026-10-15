@AGENTS.md

# Manchester United site

An unofficial, fan-made, Manchester United-only website. Owner: Ethan, who is new to web
development: favour clear, conventional code over clever code, explain non-obvious choices, and
walk through work step by step. This is a separate project from the class PL History Dashboard
(~/PL-History-Dashboard, no class rules here) and from the Premier League Tracker
(~/Premier-League-Website). Real football stats only: no fantasy (FPL points/price/form/bonus/BPS).

## What it will have (agreed with Ethan)

- Current-season hub (table, fixtures, results, scorers), refreshed automatically
- All-time history since 1878: every competition United has played in, finals (with date and
  location), stadium history (Old Trafford and earlier grounds), permanent AND acting managers
- Honours and awards in two versions: all-time, and since 1992 (Premier League era)
- Squad page and a page per player; a page per match (line-ups, scorers, assists, cards)
- Intro: a top-down zoom into Old Trafford. Centre-page scrolling. Slideshow of famous
  United victories (free-licensed photos with credits only, e.g. Wikimedia Commons; or photos Ethan supplies)
- A 3D interactive model of Wayne Rooney's overhead kick (Man Utd 2-1 Man City, Old Trafford, 12 Feb 2011:
  verify every fact before showing it). Stylised player in a red kit built in three.js, no real face
- Extra ideas to offer later: head-to-head vs rivals, Munich 1958 memorial, 1999 Treble, Class of '92,
  captains, shirt numbers, kits through the years, "On this day"

## Colours (agreed with Ethan)

Red `#DA291C`, black `#000000`, white `#FFFFFF`, gold `#FBE122` (sparingly: trophies and highlights).
Defined as Tailwind tokens in `src/app/globals.css` (`bg-united-red`, `text-united-gold`, ...).
Ask Ethan before introducing any other colour.

## Stack

Next.js 16.4 (App Router, Turbopack) as a **static export** (`output: "export"`) · TypeScript · Tailwind v4 ·
Drizzle ORM + libsql reading a local SQLite file `data/app.db` **at build time**.
Hosting: **GitHub Pages** (free), like the PL History Dashboard: `.github/workflows/deploy.yml` builds on every
push to main and publishes `out/` to https://ethankaufman.github.io/ManUtd-Site/ (needs a PUBLIC repo on a free
GitHub plan). No Turso/Vercel: visitors never touch the database; the pages are plain files.

Static-export rules (this is not the Next.js you know; read `node_modules/next/dist/docs/` first, esp.
`01-app/02-guides/static-exports.md`): no server features (no route handlers that read requests, cookies,
headers, middleware, ISR, `next/image` optimisation). Cache Components/PPR are OFF because they cannot be
combined with export. Dynamic routes (player/match pages) need `generateStaticParams`. Everything is built with
`basePath` = `NEXT_PUBLIC_BASE_PATH` (`/ManUtd-Site` in production, empty locally), so use `next/link` and
prefix static asset URLs with the base path. Anything interactive (search, filters, 3D) runs in the browser.
Freshness: a scheduled GitHub Action re-ingests data and rebuilds the site (like the dashboard's weekly job).

## Conventions

- All database reads go through `src/lib/data.ts`. DB access: `import { db, schema } from "@/db"`.
- Change the DB shape only in `src/db/schema.ts`, then `npm run db:generate` + `npm run db:migrate`.
  Never hand-edit `drizzle/`; commit it.
- Secrets in `.env` (git-ignored); keep `.env.example` in sync.
- Photos and data: only use material we may publish (free licences with attribution; Wikipedia is
  CC BY-SA). Record every image credit. Do NOT scrape premierleague.com or manutd.com.
- Club crest/badge belongs to the club: use sparingly and say the site is unofficial.

## Commands

`npm run dev` · `npm run build` · `npm run lint` · `npm run db:generate` · `npm run db:migrate` · `npm run db:reset`
After deleting `data/app.db`, restart `npm run dev`.

## Phase plan

- **Phase 0, setup: ✅ local.** Next.js + Drizzle/SQLite, colour tokens, branded placeholder homepage reading the
  tagline from the database. **LIVE** at https://ethankaufman.github.io/ManUtd-Site/ (public repo ethankaufman/ManUtd-Site, GitHub Pages via Actions). Commit email is the GitHub noreply address: keep it that way (git config is set in this repo).
- Phase 1, look and intro: layout, scroll sections, Old Trafford zoom intro, photo slideshow
- Phase 2, current-season hub (reuse ideas/scripts from ~/PL-History-Dashboard/scripts/update_current_season.py)
- Phase 3, squad and player pages
- Phase 4, match pages (1992 onward data already exists in ~/PL-History-Dashboard/data: filter to Manchester United)
- Phase 5, history: competitions, finals, stadiums, managers, honours (all-time + since 1992)
- Phase 6, Rooney overhead kick in 3D
- Phase 7, extras and polish
