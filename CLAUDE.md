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
- **Overhead Kicks: its OWN tab/page (`/overhead-kicks`)**: 3D interactive models of Wayne Rooney's overhead kick
  (Man Utd 2-1 Man City, Old Trafford, 12 Feb 2011) AND Alejandro Garnacho's Puskas-winning overhead kick (v Everton).
  For EACH: the distance (from goal) and a match summary. Research and verify every fact/number from sources before
  showing it; if no reliable distance exists, say it is an estimate and how it was made. Stylised player in a red kit
  built in three.js, no real face
- Slideshow: AT LEAST 7 HIGH-QUALITY (high resolution) free-licensed photos of famous United wins, each with credit/licence
- "Red Devils" (the club nickname): Ethan wants some red-devil styling but is not sure how far to take it. First pass is
  subtle (horns badge, pitchfork divider, drawn in the same ink style). Do NOT use the club crest. Ask before going bigger
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
- **Phase 1, look and intro: in progress.** DONE: (1) chapter layout (`src/lib/chapters.ts` is the one list; home chapters
  section, top nav with phone menu, footer disclaimer, a placeholder page per chapter incl. `/overhead-kicks`; trailingSlash is ON
  so /x and /x/ both work on GitHub Pages; red-devil touches = horns badge + pitchfork divider/footer); (2) DARK theme, now "FLOODLIT EDITORIAL" (Ethan dropped the comic-book look for chapters, 2026-10-15): near-black pages, big white Anton
  headlines, Geist Mono small caps labels, thin red rules, flat charcoal cards with 1px borders, soft floodlight glow (`.floodlight`, `.glow-red` in globals.css),
  red pitchfork/horns drawn flat. No thick outlines, offset shadows, gold caption boxes, Bangers or Comic Neue any more. The 3D intro still has its halftone post-effect (comic.ts): ask Ethan whether to soften it; (3) the intro is now a NIGHT-TIME 3D FLIGHT
  (`src/components/intro3d/`, three.js, loaded on demand): through the flyer's eyes (no character drawn: Superman/DC marks are
  not used), a level run over the city, a banked sideways swoop, a tightening spiral round the stadium, a dive over the south
  stand, landing at the tunnel mouth facing the pitch. Files: layout.ts (data + flight waypoints), scenery.ts (city/roads/canal,
  window shader), stadium3d.ts (lofted bowl, crowd, pitch), flight.ts (camera path + banking), comic.ts (halftone/posterise
  post-effect), scene3d.ts, Intro3D.tsx (scroll controller + comic overlays). `?p=0.5` freezes it for screenshots. Verified with
  puppeteer-core + Chrome/SwiftShader only: NOT tested on a real GPU. If it stutters, lower crowd points/instances or MSAA.
  DONE: "Famous victories" slideshow on the home page after the intro (`src/components/Slideshow.tsx`, data + credits in `src/lib/slides.ts`,
  photos in `public/photos/`): 7 Wikimedia Commons photos, arrows/keys/swipe/dots, autoplay that pauses on hover and is off for reduced motion,
  caption = competition, venue, date, result, scorers, photo credit with licence link. Match facts verified against Wikipedia. "Skip intro" now jumps to it.
  Fonts: Anton (titles), Bangers (sound effects), Comic Neue (captions).
  Illustration facts to keep true: Old Trafford opened 1910; over 74,000 seats; nickname "Theatre of Dreams"; address Sir Matt Busby Way, Stretford.
  The city/streets are a stylised drawing, NOT a real map: never label it as one.
- **Phase 2, current-season hub: built (2026-10-15).** `/season` shows EVERY competition United play in that season
  (Premier League, Champions/Europa/Conference League, Carabao Cup, FA Cup, Community Shield, pre-season friendlies): overview,
  next match, per-competition status, tabs with results/fixtures/tables, player stats. Data flow: `scripts/update_season.py` (ESPN public
  soccer API, unofficial; stdlib only; self-checks) -> `data/season/<season>.json` (committed) -> `npm run db:seed` -> SQLite tables
  `competition`, `match`, `standing` -> `getSeasonHub()` in src/lib/data.ts -> components in src/components/season/. Pure types/helpers live
  in src/lib/season.ts (NO db import, so client components may use them). `.github/workflows/update-season.yml` refreshes twice daily
  (07:00 and 23:30 UTC), commits changed data and starts the deploy. ESPN files an own goal under the team that BENEFITS. Match-detail
  (goals, cards, line-ups) is stored per match for the later match pages. FA Cup 2026-27 is empty until January (ESPN 500s on it: harmless).
- **Phase 3, squad and player pages: built (2026-10-15).** `/squad` (grouped by position) and `/squad/<slug>` (one static page per player via
  generateStaticParams, `dynamicParams = false`). Roster comes from ESPN's roster endpoint (saved in the season JSON as `squad`, table
  `squad_member`); each player's apps/starts/goals/assists/cards are WORKED OUT from the stored match line-ups and events (matched by ESPN player id /
  name) in `loadSquad()` in src/lib/data.ts. No photos (ESPN headshots belong to others); ignore ESPN's `coach` field (it returns junk).
  NOT done yet: career stats and past players (needs another data source; belongs with the History chapter), minutes played.
- **Phase 4, Every Match: built (2026-10-17, not yet pushed when written).** `/matches` and `/matches/<season>/` (one static page per season, 35 seasons,
  2,210 matches, 1992-93 to now, EVERY competition). Season dropdown, competition chips, each match a native `<details>` that opens to goals, cards, line-ups
  (src/components/matches/, `getMatchSeasons`/`getSeasonMatches` in data.ts). Data in `data/season/<season>.json`, same shape for every season:
  * 2001-02 to 2025-26: `scripts/backfill_espn.py` (ESPN; FA Cup read from the calendar-year scoreboard because its team schedule 500s; line-ups, cards, venues),
    then `scripts/reconcile_history.py` cross-checks each season against Wikipedia (pairs by date+score), fills penalty shoot-out scores (ESPN omits them for old
    games), adds friendlies ESPN lacks (`src: "wikipedia"`, `detail_incomplete`), removes ESPN duplicates (2009-10 lists fixtures twice, some with WRONG scores)
    and unplayed entries, and checks every league result against the dashboard's official data (+-1 day: the dashboard has 12 dates a day early in 2003-04).
    Reports in `data/audit/`. All 24 ESPN league tables equal the official tables.
  * 1992-93 to 2000-01: `scripts/import_history.py` (Wikipedia season pages, CC BY-SA, credit them) with official tables from ~/PL-History-Dashboard/data/final_tables.csv.
    United's scorers only (surnames), no line-ups/cards: the page says so (`incomplete`). 31 old friendlies list no scorers at all.
  * Current season still refreshed twice daily by update_season.py. Past seasons are static: never re-run backfill/reconcile without checking the audit notes.
  * Squad photos: `scripts/fetch_player_photos.py` -> public/players/ + src/lib/player-photos.json (free licences only; 25 of 31; Heaven too small, de Ligt credit incomplete).
- **Phase 5a, History: built (2026-10-17, not pushed when written).** `/history` has five tabs (Timeline, Every season, Finals, Competitions, Captains), all with collapsed groups.
  Data in `data/club/*.json`, each written by a script and checked: `import_club_history.py` (Wikipedia "List of Manchester United F.C. seasons", 1886-87 to 2025-26; rowspans handled
  column by column; checked: P=W+D+L, points rule, and all 34 Premier League seasons equal the official tables), `import_finals.py` (79 finals + Charity/Community Shield matches from each
  final's Wikipedia infobox; 1992+ cross-checked against our match data), `fix_pens.py` (shoot-out scores: winner has the higher score; friendlies' scores dropped), `build_club_summary.py`
  (competitions counted from the two files above), `import_captains.py` (57 captaincies, contiguous 1878-present), `build_timeline.py` (24 entries; dates/scores/counts are looked up in
  the data and asserted, wording checked against Wikipedia's history articles). `src/lib/club.ts` reads them; components in `src/components/history/`. `scripts/shot.mjs` takes
  screenshots of pages that need clicking (talks to Chrome directly, no packages).
  NOT done: shirt numbers and kits through the years (kit images are not free to use). Honours chapter should be built FROM these files (13 FA Cups, 6 League Cups, 20 league titles,
  3 European Cups, 21 Community Shields incl. 4 shared all agree with Wikipedia's summary).
- Phase 5b, honours, managers, stadium: not started
- **Phase 6, Overhead Kicks: built (2026-10-15), then reworked.** `/overhead-kicks` now shows ONLY Rooney v Man City (12 Feb 2011, 2-1, 78'):
  Ethan asked to remove the Garnacho goal and to stop emphasising distances (distance is now one small bullet; ~12 yd is OUR ESTIMATE, labelled so,
  never present it as measured). Facts and sources live in `src/lib/kicks.ts` (the page shows tabs automatically if more goals are added;
  Berbatov v Liverpool 19 Sep 2010 3-2, 59', is verified and could be added). 3D = `src/components/kick3d/`: figure.ts (smooth mannequin: rounded
  limbs, red shirt with number 10, white shorts, black socks/boots; faceless), motion.ts (key poses + Hermite spline), backdrop.ts (striped turf, crowd stands
  behind the goal and along the sides, ad boards, floodlight glows), scene.ts (goal, ball with glow, gold trail, shadows, OrbitControls), KickViewer.tsx
  (play/replay/slider/speed/reset), OverheadKicks.tsx (page body). Movement is illustrative and says so on the page. Verified in headless SwiftShader only.
- Phase 7, extras and polish
