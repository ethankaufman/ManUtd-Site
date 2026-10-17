#!/usr/bin/env python3
"""One-off back-fill of past seasons (2001-02 onward) from ESPN into data/season/<season>.json.

It reuses the fetching and parsing in update_season.py, so past seasons have exactly the same shape as the
current one: every competition, scorers, cards and line-ups. Differences for past seasons:
  * ESPN's FA Cup team schedule always fails, so FA Cup games are read from its calendar-year scoreboard.
  * Names use the period: "League Cup" and "UEFA Cup" (not Carabao Cup / Europa League before 2009).
  * Only the Premier League table is kept (older Champions League group tables are not reliable).
Already-written seasons are skipped, so it can be stopped and restarted.

    python3 scripts/backfill_espn.py 2005          # one season (start year), written
    python3 scripts/backfill_espn.py               # every season 2001 .. last finished one
"""
import json
import sys
from datetime import datetime, timezone

import update_season as u

PAST = [
    ("eng.1", "premier-league", "Premier League", "league"),
    ("uefa.champions", "champions-league", "UEFA Champions League", "europe"),
    ("uefa.europa", "europa-league", "UEFA Europa League", "europe"),
    ("uefa.europa.conf", "conference-league", "UEFA Conference League", "europe"),
    ("eng.league_cup", "league-cup", "League Cup", "cup"),
    ("eng.fa", "fa-cup", "FA Cup", "cup"),
    ("eng.charity", "community-shield", "FA Community Shield", "cup"),
    ("uefa.super_cup", "uefa-super-cup", "UEFA Super Cup", "europe"),
    ("fifa.cwc", "club-world-cup", "FIFA Club World Cup", "europe"),
    ("club.friendly", "friendlies", "Friendlies", "friendly"),
]


def season_name(code, name, year):
    if code == "uefa.europa" and year < 2009:
        return "UEFA Cup"
    return name


def fa_cup_events(year):
    """United's FA Cup games that ESPN files under this season, from the calendar-year scoreboards."""
    found = {}
    for cal in (year, year + 1):
        d = u.get(f"{u.SITE}/eng.fa/scoreboard?dates={cal}&limit=1000")
        for e in (d or {}).get("events", []):
            if e.get("season", {}).get("year") == year:
                found[e["id"]] = e
    return list(found.values())


def fetch_comp(code, slug, kind, year):
    if code == "eng.fa":
        events = fa_cup_events(year)
    else:
        d = u.get(f"{u.SITE}/{code}/teams/{u.TEAM_ID}/schedule?season={year}")
        events = (d or {}).get("events", [])
    out = {}
    for e in events:
        m = u.parse_event(e, code, kind)
        if m:
            m["comp"] = slug
            out[m["id"]] = m
    return list(out.values())


def build(year):
    season = f"{year}-{str(year + 1)[2:]}"
    matches, comps = [], []
    for code, slug, name, kind in PAST:
        ms = fetch_comp(code, slug, kind, year)
        if ms:
            name = season_name(code, name, year)
            comps.append({"slug": slug, "espn": code, "name": name, "kind": kind, "has_table": code == "eng.1", "matches": len(ms)})
            matches += ms
            print(f"  {name}: {len(ms)}")
    seen, unique = set(), []
    for m in matches:  # the same game can appear under two codes
        if m["id"] not in seen:
            seen.add(m["id"])
            unique.append(m)
    matches = unique
    for m in matches:
        if m["state"] != "finished":
            continue
        s = u.get(f"{u.SITE}/{m['espn']}/summary?event={m['id']}")
        if s:
            m.update(u.parse_details(s))
        else:
            m["detail_incomplete"] = True
    # a game with no goal events at all (or fewer than the score) has incomplete detail in ESPN's data
    for m in matches:
        if m["state"] == "finished" and "goals" in m and len(m["goals"]) < (m["hg"] or 0) + (m["ag"] or 0):
            m["detail_incomplete"] = True
        m.pop("comp_kind", None)
    matches.sort(key=lambda m: m["kick"])
    tables = {}
    rows = u.table_rows("eng.1", year)
    if rows:
        tables["eng.1"] = rows
    return {
        "season": season,
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "source": "ESPN public soccer service (unofficial), back-filled",
        "past": True,
        "competitions": comps,
        "tables": tables,
        "squad": [],
        "matches": matches,
    }


def main():
    last = u.current_season_year() - 1
    years = [int(sys.argv[1])] if len(sys.argv) > 1 else range(2001, last + 1)
    for y in years:
        out = u.OUT_DIR / f"{y}-{str(y + 1)[2:]}.json"
        if out.exists() and len(sys.argv) == 1:
            continue
        print(f"Season {y}-{str(y + 1)[2:]}")
        payload = build(y)
        u.OUT_DIR.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n")
        incomplete = sum(1 for m in payload["matches"] if m.get("detail_incomplete"))
        print(f"  wrote {out.name}: {len(payload['matches'])} matches, {incomplete} with incomplete detail")


if __name__ == "__main__":
    main()
