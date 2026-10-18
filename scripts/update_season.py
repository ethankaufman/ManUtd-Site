#!/usr/bin/env python3
"""
Refresh Manchester United's current season: EVERY competition they play in, not only the league.

What it does (in plain words):
  1. Asks ESPN's public soccer service for United's results and upcoming fixtures in each competition
     (Premier League, Champions League, Europa League, Conference League, League Cup (sponsored as the Carabao Cup), FA Cup,
     Community Shield, pre-season friendlies). Competitions United are not in simply come back empty.
  2. For each finished match, fetches the match detail: scorers, assists, cards, line-ups.
  3. Fetches the league tables (Premier League, and the Champions League league phase if United are in it).
  4. Checks its own work (scores equal the goal events, table rows add up) and only then writes
     data/season/<season>.json. If a check fails it exits with an error and leaves the old file alone.

`npm run db:seed` then loads that file into the SQLite database that the site is built from.

Run:  python3 scripts/update_season.py          (standard library only, no installs)
Note: ESPN's service is public but unofficial (no signed terms), so keep requests few and polite.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

TEAM_ID = "360"  # Manchester United on ESPN
TEAM_NAME = "Manchester United"
SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer"
V2 = "https://site.api.espn.com/apis/v2/sports/soccer"
UA = {"User-Agent": "ManUtdFanSite/1.0 (non-commercial fan project)"}

# (espn code, our slug, name, kind). The order is the order the site shows them in.
COMPETITIONS = [
    ("eng.1", "premier-league", "Premier League", "league"),
    ("uefa.champions", "champions-league", "UEFA Champions League", "europe"),
    ("uefa.europa", "europa-league", "UEFA Europa League", "europe"),
    ("uefa.europa.conf", "conference-league", "UEFA Conference League", "europe"),
    ("eng.league_cup", "carabao-cup", "League Cup", "cup"),
    ("eng.fa", "fa-cup", "FA Cup", "cup"),
    ("eng.charity", "community-shield", "FA Community Shield", "cup"),
    ("club.friendly", "friendlies", "Pre-season friendlies", "friendly"),
]
# the competitions that have a table
TABLES = {"eng.1", "uefa.champions"}

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data" / "season"


def get(url, retries=3):
    for attempt in range(retries):
        try:
            time.sleep(0.4)
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            if attempt == retries - 1:
                print(f"  could not fetch {url}: {e}", file=sys.stderr)
                return None
            time.sleep(3 * (attempt + 1))


def current_season_year(today=None):
    """The football season runs August to May, so the 'season year' is the year it starts in."""
    today = today or datetime.now(timezone.utc)
    return today.year if today.month >= 7 else today.year - 1


def team_names(comp):
    return comp["team"]["displayName"]


def parse_event(e, code, kind):
    """One ESPN event -> our match dict (without details). Returns None if United are not in it."""
    c = e["competitions"][0]
    sides = {s["homeAway"]: s for s in c["competitors"]}
    if "home" not in sides or "away" not in sides:
        return None
    if TEAM_ID not in (sides["home"]["team"]["id"], sides["away"]["team"]["id"]):
        return None
    st = c["status"]["type"]
    state = {"pre": "scheduled", "in": "live", "post": "finished"}.get(st.get("state"), "scheduled")
    if st.get("name") in ("STATUS_POSTPONED", "STATUS_CANCELED", "STATUS_SUSPENDED"):
        state = "postponed"

    def score(s):
        v = s.get("score")
        v = v.get("displayValue") if isinstance(v, dict) else v
        return int(v) if v not in (None, "") and state in ("finished", "live") else None

    def shootout(s):
        v = s.get("shootoutScore")
        return int(v) if v is not None else None

    venue = c.get("venue") or {}
    m = {
        "id": e["id"],
        "espn": code,
        # only cups and European games have a meaningful round name ("Third Round"); the league has none
        "round": ((e.get("seasonType") or {}).get("name") or "") if kind in ("cup", "europe") else "",
        "kick": e["date"],
        "state": state,
        "home": team_names(sides["home"]),
        "away": team_names(sides["away"]),
        "hg": score(sides["home"]),
        "ag": score(sides["away"]),
        "pens": None,
        "venue": venue.get("fullName"),
        "city": (venue.get("address") or {}).get("city"),
        "att": c.get("attendance") or None,
        "neutral": bool(c.get("neutralSite")),
        "note": st.get("description") if state == "finished" and st.get("description") not in ("Full Time", None) else None,
    }
    ph, pa = shootout(sides["home"]), shootout(sides["away"])
    if ph is not None and pa is not None:
        m["pens"] = [ph, pa]
    m["comp_kind"] = kind
    return m


def clock_text(ev):
    t = (ev.get("clock") or {}).get("displayValue") or ""
    return t.replace("'+", "+").replace("'", "").strip()


GOAL_KINDS = {"goal": "Goal", "goal---header": "Goal", "goal---free-kick": "Goal", "own-goal": "Own goal", "penalty---scored": "Penalty"}


def dedupe(events):
    """One entry per (minute, team, player, kind), keeping the copy that names an assist if only one does."""
    best = {}
    for e in events:
        k = (e["min"], e["team"], e["player"], e["kind"])
        if k not in best or (e.get("assist") and not best[k].get("assist")):
            best[k] = e
    return list(best.values())


def parse_details(summary):
    """Goals, cards and line-ups from an ESPN match summary."""
    goals, cards = [], []
    for ev in summary.get("keyEvents", []):
        t = ev["type"]["type"]
        who = [p["athlete"]["displayName"] for p in ev.get("participants", [])]
        team = (ev.get("team") or {}).get("displayName")
        shoot = bool(ev.get("shootout"))
        if t.startswith("goal") or t in GOAL_KINDS or t.startswith("penalty---scored"):
            if shoot:
                continue
            goals.append(
                {
                    "min": clock_text(ev),
                    "team": team,
                    "player": who[0] if who else None,
                    "assist": who[1] if len(who) > 1 and t != "own-goal" else None,
                    "kind": GOAL_KINDS.get(t, "Penalty" if t.startswith("penalty") else "Goal"),
                }
            )
        elif t in ("yellow-card", "red-card", "yellow-red-card"):
            cards.append({"min": clock_text(ev), "team": team, "player": who[0] if who else None, "kind": {"yellow-card": "Yellow", "red-card": "Red", "yellow-red-card": "Second yellow"}[t]})
    # ESPN sometimes lists the same event twice (seen in 2013-14 and 2017-18): the same minute, team, player and kind
    # twice is never real, so keep the first
    goals = dedupe(goals)
    cards = dedupe(cards)
    lineups = []
    for r in summary.get("rosters", []):
        players = []
        for p in r.get("roster", []):
            a = p.get("athlete") or {}
            players.append(
                {
                    "id": a.get("id"),
                    "name": a.get("displayName"),
                    "no": p.get("jersey"),
                    "pos": (p.get("position") or {}).get("abbreviation"),
                    "start": bool(p.get("starter")),
                    "on": bool(p.get("subbedIn")),
                    "off": bool(p.get("subbedOut")),
                }
            )
        lineups.append({"team": r["team"]["displayName"], "side": r.get("homeAway"), "formation": r.get("formation"), "players": players})
    return {"goals": goals, "cards": cards, "lineups": lineups}


def fetch_competition(code, slug, name, kind, year):
    """Every United match in this competition this season."""
    events = {}
    for param in ("", "?fixture=true"):
        d = get(f"{SITE}/{code}/teams/{TEAM_ID}/schedule{param}")
        if not d:
            continue
        season = d.get("season") or {}
        if season.get("year") != year and code not in ("club.friendly", "eng.charity"):
            continue  # ESPN still shows last season's matches for a competition that has not started
        for e in d.get("events", []):
            if e.get("season", {}).get("year", year) != year:
                continue
            m = parse_event(e, code, kind)
            if m:
                m["comp"] = slug
                events[m["id"]] = m
    return list(events.values())


def table_rows(code, year):
    d = get(f"{V2}/{code}/standings?season={year}")
    if not d or not d.get("children"):
        return None
    rows = []
    for en in d["children"][0]["standings"]["entries"]:
        s = {x["name"]: x.get("value") for x in en["stats"]}
        rows.append(
            {
                "rank": int(s["rank"]),
                "team": en["team"]["displayName"],
                "p": int(s["gamesPlayed"]),
                "w": int(s["wins"]),
                "d": int(s["ties"]),
                "l": int(s["losses"]),
                "gf": int(s["pointsFor"]),
                "ga": int(s["pointsAgainst"]),
                "pts": int(s["points"]),
                "zone": (en.get("note") or {}).get("description"),
            }
        )
    rows.sort(key=lambda r: r["rank"])
    return rows


def slugify(name):
    import unicodedata

    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain.lower()).strip("-")


def fetch_squad():
    """The current first-team squad (bio details only; the numbers come from our own match data)."""
    d = get(f"{SITE}/eng.1/teams/{TEAM_ID}/roster")
    if not d:
        return None
    squad, used = [], set()
    for a in d.get("athletes", []):
        name = a.get("displayName") or a.get("fullName")
        if not name:
            continue
        slug = slugify(name)
        if slug in used:
            slug = f"{slug}-{a['id']}"
        used.add(slug)
        inches = a.get("height")
        squad.append(
            {
                "id": a["id"],
                "slug": slug,
                "name": name,
                "no": a.get("jersey"),
                "pos": (a.get("position") or {}).get("displayName"),
                "age": a.get("age"),
                "dob": (a.get("dateOfBirth") or "")[:10] or None,
                "nation": a.get("citizenship"),
                "height_cm": round(inches * 2.54) if inches else None,
            }
        )
    return squad


def check(matches, tables):
    """Our own sanity checks: if one fails we refuse to write the file."""
    problems = []
    for m in matches:
        if m["state"] != "finished" or "goals" not in m:
            continue
        scored = {m["home"]: 0, m["away"]: 0}
        for g in m["goals"]:
            if g["team"] in scored:
                scored[g["team"]] += 1
        # ESPN lists an own goal under the team that BENEFITS in the score, so compare totals only
        if sum(scored.values()) != (m["hg"] or 0) + (m["ag"] or 0) and not m.get("detail_incomplete"):
            problems.append(f"{m['home']} {m['hg']}-{m['ag']} {m['away']} ({m['kick'][:10]}): {sum(scored.values())} goal events")
    for code, rows in tables.items():
        for r in rows:
            if r["w"] + r["d"] + r["l"] != r["p"]:
                problems.append(f"{code}: {r['team']} W+D+L != P")
            if r["w"] * 3 + r["d"] != r["pts"] and code == "eng.1":
                problems.append(f"{code}: {r['team']} points do not add up (deductions?)")
        if sum(r["gf"] for r in rows) != sum(r["ga"] for r in rows):
            problems.append(f"{code}: goals for != goals against")
    return problems


def main():
    year = current_season_year()
    season = f"{year}-{str(year + 1)[2:]}"
    out_file = OUT_DIR / f"{season}.json"
    old = json.loads(out_file.read_text()) if out_file.exists() else {"matches": []}
    cache = {m["id"]: m for m in old["matches"]}
    now = datetime.now(timezone.utc)
    print(f"Season {season}")

    matches, comps = [], []
    for code, slug, name, kind in COMPETITIONS:
        ms = fetch_competition(code, slug, name, kind, year)
        print(f"  {name}: {len(ms)} matches")
        comps.append({"slug": slug, "espn": code, "name": name, "kind": kind, "has_table": code in TABLES, "matches": len(ms)})
        matches.extend(ms)

    # match detail for finished games (cached; matches from the last 4 days are fetched again in case of corrections)
    for m in matches:
        if m["state"] != "finished":
            continue
        old_m = cache.get(m["id"])
        recent = (now - datetime.fromisoformat(m["kick"].replace("Z", "+00:00"))).days < 4
        has_ids = bool(old_m) and all(p.get("id") for lu in old_m.get("lineups", []) for p in lu["players"])
        if old_m and "goals" in old_m and has_ids and not recent:
            m.update({k: old_m[k] for k in ("goals", "cards", "lineups") if k in old_m})
            continue
        s = get(f"{SITE}/{m['espn']}/summary?event={m['id']}")
        if s:
            m.update(parse_details(s))
            print(f"    detail: {m['home']} {m['hg']}-{m['ag']} {m['away']}")

    # label matchdays for the league phase of European competitions (each club plays once per matchday)
    for slug in ("champions-league", "europa-league", "conference-league"):
        league_phase = sorted((m for m in matches if m["comp"] == slug and m["round"] == "League Phase"), key=lambda m: m["kick"])
        for i, m in enumerate(league_phase, 1):
            m["round"] = f"League phase · Matchday {i}"

    matches.sort(key=lambda m: m["kick"])
    tables = {}
    for code in sorted(TABLES):
        if any(c["espn"] == code and c["matches"] for c in comps):
            rows = table_rows(code, year)
            if rows:
                tables[code] = rows

    squad = fetch_squad() or old.get("squad", [])
    problems = check(matches, tables)
    if not squad:
        problems.append("squad list is empty")
    if problems:
        print("Checks FAILED, nothing written:", *problems, sep="\n  ", file=sys.stderr)
        sys.exit(1)

    for m in matches:
        m.pop("comp_kind", None)
    comps = [c for c in comps if c["matches"] or c["espn"] in ("eng.fa",)]  # FA Cup is shown even before it starts
    payload = {
        "season": season,
        "updated": now.strftime("%Y-%m-%dT%H:%MZ"),
        "source": "ESPN public soccer service (unofficial)",
        "competitions": comps,
        "tables": tables,
        "squad": squad,
        "matches": matches,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=1)
    # keep the file (and git history) quiet when nothing changed except the timestamp
    if out_file.exists():
        prev = re.sub(r'"updated": "[^"]*"', "", out_file.read_text())
        if prev == re.sub(r'"updated": "[^"]*"', "", text + "\n"):
            print("No changes.")
            return
    out_file.write_text(text + "\n")
    played = sum(1 for m in matches if m["state"] == "finished")
    print(f"Wrote {out_file.relative_to(ROOT)}: {len(matches)} matches ({played} played), tables: {', '.join(tables)}")


if __name__ == "__main__":
    main()
