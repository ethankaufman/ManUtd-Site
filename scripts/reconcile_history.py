#!/usr/bin/env python3
"""Cross-checks each back-filled ESPN season (data/season/<season>.json, "past": true) against Wikipedia, then
fixes what ESPN lacks. Two independent sources agreeing is how we know a season is right.

  * Matches are paired by date and score (team names are spelt differently by each source).
  * Penalty shoot-out scores (ESPN omits them for old games) are filled in from Wikipedia.
  * Friendlies missing from ESPN are added from Wikipedia (scorers are United's only, so `detail_incomplete`).
  * Anything one source has and the other does not, or any score that differs, is printed as a DISAGREEMENT
    and written to data/audit/<season>.txt, never hidden.

    python3 scripts/reconcile_history.py            # every past season file
    python3 scripts/reconcile_history.py 2008       # one season
"""
import csv
import json
import os
import sys
from pathlib import Path

import import_history as wp

ROOT = Path(__file__).resolve().parent.parent
SEASONS = ROOT / "data" / "season"
AUDIT = ROOT / "data" / "audit"
U = wp.UNITED


def united_score(m):
    return (m["hg"], m["ag"]) if m["home"] == U else (m["ag"], m["hg"])


def key(date, f, a):
    return (date, f, a)


def official_league(year):
    """{date: (United were home, home goals, away goals)} from the dashboard's official data."""
    out = {}
    if not os.path.exists(wp.DASH):
        return out
    with open(wp.DASH, newline="") as fh:
        for r in csv.DictReader(fh):
            if r["season"] == wp.season_label(year) and U in (r["home"], r["away"]):
                out[r["date"]] = (r["home"] == U, int(r["home_goals"]), int(r["away_goals"]))
    return out


def reconcile(path):
    doc = json.loads(path.read_text())
    year = int(doc["season"][:4])
    label, _title, _comps, wiki = wp.season_matches(year)
    notes = []
    doc["matches"] = [m for m in doc["matches"] if m.get("src") != "wikipedia"]
    official = official_league(year)

    def agrees(m):  # does this ESPN league score match the official result?
        o = official.get(m["kick"][:10])
        return bool(o) and m["comp"] == "premier-league" and o == (m["home"] == U, m["hg"], m["ag"])

    # games that were never played (a postponed original that was replayed on another day)
    unplayed = [m for m in doc["matches"] if m["state"] != "finished"]
    doc["matches"] = [m for m in doc["matches"] if m["state"] == "finished"]
    if unplayed:
        notes.append(f"REMOVED {len(unplayed)} unplayed/postponed ESPN entries")
    # ESPN sometimes lists one fixture twice under different ids (2009-10 does), and the copies can disagree:
    # keep the one that matches the official league result, then the one with the most detail
    best = {}
    for m in doc["matches"]:
        k = (m["kick"][:10], m["home"], m["away"], m["comp"])
        score = (agrees(m), len(m.get("goals", [])), len(m.get("cards", [])), len(m.get("lineups", [])))
        if k not in best or score > best[k][0]:
            best[k] = (score, m)
    removed = len(doc["matches"]) - len(best)
    doc["matches"] = [m for _s, m in best.values()]
    if removed:
        notes.append(f"REMOVED {removed} duplicate ESPN entries")
    espn = [m for m in doc["matches"] if m.get("src") != "wikipedia"]
    # pair by (date, United goals, opponent goals); allow the date to differ by a day (late kick-offs, time zones)
    from datetime import date, timedelta

    def d(s):
        return date.fromisoformat(s[:10])

    unmatched_wiki = list(wiki)
    for m in espn:
        f, a = united_score(m) if m["hg"] is not None else (None, None)
        hit = None
        for w in unmatched_wiki:
            if abs((d(w["date"]) - d(m["kick"])).days) <= 1 and united_score(w) == (f, a) and w["comp"] == m["comp"]:
                hit = w
                break
        if not hit:  # same day and competition, different score: report it
            for w in unmatched_wiki:
                if abs((d(w["date"]) - d(m["kick"])).days) <= 1 and w["comp"] == m["comp"]:
                    notes.append(f"SCORE DIFFERS {m['kick'][:10]} {m['comp']}: ESPN {m['home']} {m['hg']}-{m['ag']} {m['away']} vs Wikipedia {w['home']} {w['hg']}-{w['ag']} {w['away']}")
                    unmatched_wiki.remove(w)
                    break
            else:
                if m["state"] == "finished" and any(w["comp"] == m["comp"] for w in wiki):
                    notes.append(f"ONLY IN ESPN {m['kick'][:10]} {m['comp']}: {m['home']} {m['hg']}-{m['ag']} {m['away']}")
            continue
        unmatched_wiki.remove(hit)
        if hit["pens"] and not m.get("pens"):
            m["pens"] = hit["pens"]
        if not m.get("att") and hit.get("att"):
            m["att"] = hit["att"]
    added = 0
    for w in unmatched_wiki:
        if w["comp"] == "friendlies":
            doc["matches"].append(
                {
                    "id": w["id"], "espn": None, "src": "wikipedia", "round": "", "kick": w["date"], "state": "finished",
                    "home": w["home"], "away": w["away"], "hg": w["hg"], "ag": w["ag"], "pens": w["pens"],
                    "venue": None, "city": None, "att": w["att"], "neutral": w["neutral"], "note": None, "comp": "friendlies",
                    "goals": w["goals"], "cards": [], "lineups": [], "detail_incomplete": True,
                }
            )
            added += 1
        else:
            notes.append(f"ONLY IN WIKIPEDIA {w['date']} {w['comp']}: {w['home']} {w['hg']}-{w['ag']} {w['away']}")
    if added and not any(c["slug"] == "friendlies" for c in doc["competitions"]):
        doc["competitions"].append({"slug": "friendlies", "espn": None, "name": "Friendlies", "kind": "friendly", "has_table": False, "matches": added})
    for c in doc["competitions"]:
        c["matches"] = sum(1 for m in doc["matches"] if m["comp"] == c["slug"])
    doc["matches"].sort(key=lambda m: m["kick"])
    for comp in sorted({m["comp"] for m in doc["matches"]} - {w["comp"] for w in wiki}):
        notes.append(f"NOTE Wikipedia's page gave no {comp} matches to compare (layout differs); not cross-checked against it")
    notes += [f"LEAGUE vs OFFICIAL: {p}" for p in wp.check_league(year, [{**m, "date": m["kick"][:10]} for m in doc["matches"]])]
    doc["reconciled"] = True
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    AUDIT.mkdir(parents=True, exist_ok=True)
    (AUDIT / f"{doc['season']}.txt").write_text("\n".join(notes) + ("\n" if notes else ""))
    print(f"{doc['season']}: {len(doc['matches'])} matches, +{added} friendlies, {len(notes)} disagreements")
    for n in notes:
        print("   ", n)


def main():
    # only the ESPN back-filled seasons (safe to re-run: the Wikipedia friendlies added last time are removed first): the 1992-2001 files already come from Wikipedia, so there is nothing to compare
    files = sorted(p for p in SEASONS.glob("*.json") if (lambda d: d.get("past") and "ESPN" in d.get("source", ""))(json.loads(p.read_text())))
    if len(sys.argv) > 1:
        files = [p for p in files if p.name.startswith(sys.argv[1])]
    for p in files:
        reconcile(p)


if __name__ == "__main__":
    main()
