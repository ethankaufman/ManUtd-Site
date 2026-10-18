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
  KIT PHOTOS (2026-10-17): `scripts/find_kit_photos.py` + `apply_kit_photos.py` swapped in free photos of the player IN A UNITED SHIRT where Commons has one: Heaton, Maguire, Martinez, Dalot, Fernandes, Amad
  (Shaw and Mbeumo already were). Commons has almost NO free United match photos after 2022 (one photographer, Ardfern, stopped; the only 2025 ones are frames from AFC Bournemouth's video of the 4-4, CC BY 3.0),
  so ~17 players still show a previous club/country. Each credit has a `shows` note. Do not re-run find_kit_photos expecting more; check Commons for new uploads first.
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
- **Phase 5b, Honours & Awards: built (2026-10-17, not pushed when written).** `/honours`: All time / Since 1992 toggle (since 1992 = from the 1992-93 season), Trophies and Individual awards tabs.
  `scripts/build_honours.py` DERIVES every trophy from data/club/seasons.json + finals.json and stops with an error unless all 11 rows equal the honours table in Wikipedia's club article
  (70 honours: 20 league titles, 2 Second Division, 13 FA Cup, 6 League Cup, 21 Shield incl. 4 shared, 3 European Cup, Cup Winners' Cup, Europa League, Super Cup, Intercontinental, Club World Cup).
  Awards: 68 Premier League-era awards from ~/PL-History-Dashboard/data/awards.json (United winners) + Ballon d'Or (Law 1964, Charlton 1966, Best 1968, Ronaldo 2008; Wikipedia, cross-checked with the dashboard).
  Trophy photos: `scripts/fetch_trophy_photos.py` (10 hand-picked free Commons photos in public/trophies/, credits in src/lib/trophy-photos.json); NO free photo for the Second Division title or the
  FIFA Club World Cup (the card says so). The First Division picture is an illustration (render) and the European Cup photo shows another club's ribbons: both are captioned.
  NOT done: individual awards before 1992 (other than the Ballon d'Or).
- **Phase 5c, Managers: built (2026-10-17, not pushed when written).** `/managers`: 30 people / 33 spells from 1889 (4 secretary-managers, Hilditch player-manager, caretakers/interims, Wallworth acting secretary,
  not an official manager). `scripts/import_managers.py` (Wikipedia "List of Manchester United F.C. managers", records as of 24 May 2026, competitive matches only, no friendlies) -> `build_managers.py`:
  every tenure from 2013 is recomputed from our match data and must equal Wikipedia's M/W/D/L (it does); goals differ for Solskjaer (ours 308-183 vs 323-165) and Carrick's 2026 spell, OUR numbers are used
  (they match the official PL data and two sources for the cups; see data/club/audit_managers.txt). Each trophy in honours.json is assigned to the manager in charge by date and must equal Wikipedia's honours
  for him (Ferguson 38, Busby 13). Stories are written only from sentences in Wikipedia's managerial history; none for managers it says nothing about (Albut/West excepted notes, O'Farrell, Docherty have only data).
  The current manager's record is computed LIVE at build time (`getRecordSince` in data.ts), so the twice-daily deploy keeps it current; everyone else is fixed. Photos: 19 of 30 (scripts/fetch_manager_photos.py,
  public/managers/); Busby and Murphy by statue/bust; none for the early secretaries and 7 others (no free photo). NOT done: longer stories, a page per manager.
- **Phase 5d, Old Trafford: built (2026-10-17, not pushed when written).** `/stadium`, four tabs: Old Trafford (facts, dated story, four stands, memorials), The new stadium, Before Old Trafford (North Road, Bank Street,
  Maine Road), Carrington (plus The Cliff). Content is typed data in `src/lib/stadium.ts` and `src/lib/newstadium.ts`, written from sources read in Oct 2026: Wikipedia's Old Trafford/North Road/Bank Street/Maine Road/
  Cliff/Trafford Training Centre articles, and for the new stadium NPR (11 Mar 2025), Wallpaper (12 Mar 2025), ArchDaily (13 Mar 2025), Sky Sports (22 Jun 2026), The Independent via Yahoo (9 Jul 2026) and Trafford
  Council (9 Jul and 29 Sep 2026). EVERY new-stadium statement is tagged "official" (club/council) or "reported" (press). Cross-check caught Wallpaper's "visible from 40 miles" (Sky/NPR: 40 km = 25 miles) and its 200 m mast
  height (single source, not used). The club/Foster images are NOT free: described and linked, never shown. Old Trafford's own future is stated as unsettled (NPR Mar 2025 said "planned for demolition"; Sky Jun 2026 says
  United keep playing there during construction). Carrington: <10 miles from Old Trafford, 108 acres (85 used), opened 2000, GBP50m Foster + Partners first-team building upgrade inaugurated 8 Aug 2025; NO street address is
  given (not verified). Photos: scripts/fetch_stadium_photos.py (10; none free for Bank Street). NOTE the Commons file "Carrington Training Centre - geograph 4201045" is MANCHESTER CITY's, not United's: do not use.
  This is a live project: re-read the sources before changing any new-stadium fact.
- **Phase 6 became LEGENDS (2026-10-17).** Ethan took the Overhead Kicks chapter "in another direction": chapter 08 is now `/legends` (index of 20 portrait cards by era) and `/legends/<slug>` (a page each).
  Legends (Ethan chose "20 legends, recommended"): Edwards, Charlton, Law, Best, Stiles, Robson, Hughes, Schmeichel, Cantona, Keane, Neville, Scholes, Giggs, Beckham, Solskjaer, Ronaldo, Rooney, Ferdinand, Vidic, van der Sar.
  Data: `scripts/import_legends.py` (years/apps/goals, all competitions, from Wikipedia's 100+ appearances list; cross-checked within 1-2 apps for the five whose whole career is in our ESPN data),
  `build_legends.py` (trophies = the "Manchester United" block of each player's Wikipedia Honours section, EVERY entry verified against honours.json: participation-based, so Neville has 8 league titles not 12; awards from our awards data + Ballon d'Or),
  `data/club/legend_stories.json` (stories written ONLY from sentences in each Wikipedia article; keep it that way), `find_legend_photos.py` + `apply_legend_photos.py` (portraits in public/legends/, captions say exactly what each shows:
  Edwards = statue, Stiles = 1966 Panini card, Hughes/Cantona/Robson etc. = later portraits; in a United shirt: Neville, Scholes, Giggs, Beckham (1999 FA Cup final, cropped), Ronaldo, Rooney, Vidic, van der Sar, Ferdinand).
  Rooney's page embeds the 3D overhead kick (`src/components/kick3d/OverheadKicks.tsx`, `src/lib/kicks.ts`: still ONLY Rooney's goal, ~12 yd distance is OUR ESTIMATE). `/overhead-kicks` now just forwards to `/legends/wayne-rooney`.
  Not covered: individual awards before 1992 (except the Ballon d'Or). `data/club/_cache/` (downloaded Wikipedia wikitext) is git-ignored; re-run import scripts to rebuild it.
- **Full-site check (2026-10-17).** Three tools, run them again before any big release: `node scripts/audit_pages.mjs http://localhost:8766 report.json` (every page at 1280 and 390 px: sideways overflow, cut-off text,
  broken images, console errors), `python3 scripts/check_site.py [--no-web]` (internal links, images, outside links, data agreeing across chapters) and `node scripts/dump_text.mjs` (all text of every tab, for spell-checking).
  Result: no page scrolls sideways, no broken images or console errors (the audit still lists the intro's decorative SVG shapes and a screen-reader-only label: both are fine). Fixed on the way: Legends years
  (career-table years + first-team note), duplicate ESPN goal events (deduped in update_season.py), team names cut off on phones (match rows use wrapping, not `truncate`), "Carabao Cup" -> "League Cup" everywhere,
  History season table cup codes made readable (Qual. 2, Int. round) with a key. After changing season data run `npm run db:reset` before building, or the pages show the old database.
- **Phase 7a, On this day (2026-10-18, built; not pushed when written).** `/on-this-day` (browse any date: month/day pickers, day arrows, Today; date kept in the address as `#02-06`) and an "On this day" section on the home page
  between the slideshow and the chapters (today's UK date, up to 3 items, link to the full page). Static site, so "today" is worked out in the visitor's browser: `src/lib/onthisday.ts` builds ONE index at build time
  (`src/app/on-this-day.json/route.ts` -> `out/on-this-day.json`, ~490 KB, ~58 KB zipped) and `src/components/onthisday/` fetches it. Contents: every finished COMPETITIVE match since 1992 (1,928; friendlies excluded) from the match database,
  the 31 finals/replays before 1992 from data/club/finals.json, and the 14 dated entries of data/club/timeline.json (a final is left out when the timeline already tells that day). Scores are home-side first (neutral finals: United first);
  shoot-outs are judged from the penalty score, not the W/D/L chip. 308 of 366 dates have something; the page says so when a date is empty. Not in it: friendlies, births/deaths of legends (not verified).
- **Phase 7b, Head to head (2026-10-18, built; not pushed when written).** `/head-to-head`: quick-pick chips (Liverpool, Manchester City, Arsenal, Chelsea, Leeds, Tottenham, Newcastle, Everton), a menu of all 178 clubs United have met in a
  competitive match since 1992-93, and for the chosen club: P/W/D/L/goals/win rate, W-D-L bar, last five, biggest win, heaviest defeat, first and latest meeting, top five United scorers against them (counted by SURNAME, the early seasons list
  only surnames), home/away and by-competition tables, and every meeting (filter by competition, newest first). Club kept in the address (`#liverpool`). No new data file: it reads the same `/on-this-day.json` index (matches with season >= 1992-93),
  grouped in the browser (`src/lib/h2h.ts`). Not all-time: pre-1992 meetings are not in our data and the page says so. Shoot-outs count as draws. Totals were cross-checked against a separate count from data/season for four clubs.
  NAME TIDY: `scripts/names.py` gives ONE spelling to clubs (Fenerbahce/Fenerbahçe, Feyenoord Rotterdam, Porto/FC Porto), grounds (St James' Park, Şükrü Saracoğlu Stadium ...) and cup rounds ("Round 3" -> "Third Round",
  "Quarterfinals" -> "Quarter-final", "Round 5 replay" -> "Fifth Round / Replay"); `update_season.py` applies it to everything it writes, and `python3 scripts/names.py` re-tidies every data/season file (safe to repeat). Without it
  the two sources split the totals. Remember `npm run db:reset` after changing season data.
- Phase 7, extras and polish
