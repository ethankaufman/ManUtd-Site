#!/usr/bin/env python3
"""One spelling for club names and cup rounds, whichever source (ESPN or Wikipedia) a match came from.

The two sources write the same thing differently ("Fenerbahce"/"Fenerbahçe", "Round 3"/"Third round", "Quarterfinals"/
"Quarter-finals"), which would split the head-to-head totals and look untidy on the match pages. update_season.py calls
these functions on everything it writes; running this file tidies every data/season/*.json (safe to run again):

    python3 scripts/names.py
"""
import glob
import json
import re
from pathlib import Path

TEAMS = {"Fenerbahce": "Fenerbahçe", "Feyenoord Rotterdam": "Feyenoord", "Porto": "FC Porto"}
VENUES = {
    "Lerkendal Stadion": "Lerkendal Stadium",
    "Loftus Road Stadium": "Loftus Road",
    "Parken Stadion": "Parken",
    "San Mames": "San Mamés",
    "St Jakob Park": "St. Jakob-Park",
    "St. James' Park": "St James' Park",
    "Sukru Saracoglu Stadium": "Şükrü Saracoğlu Stadium",
}
ORD = {"1": "First", "2": "Second", "3": "Third", "4": "Fourth", "5": "Fifth", "6": "Sixth"}


def tidy_team(name):
    return TEAMS.get(name, name)


def tidy_venue(v):
    v = (v or "").strip()
    return VENUES.get(v, v) or None


def tidy_round(r):
    """'Round 3' -> 'Third Round', 'Quarterfinals' -> 'Quarter-final', 'Round 5 replay' -> 'Fifth Round / Replay' ..."""
    if not r:
        return r
    r = re.sub(r"^Football League Cup - ", "", r)
    # a year plus a competition name is not a round ("2024 English FA Community Shield", "2008 UEFA Super Cup")
    if re.match(r"^\d{4} (English FA Community Shield|UEFA Super Cup)$", r):
        return ""
    r = re.sub(r"^\d{4}/\d\d ", "", r)  # "2016/17 Group Stage"
    r = re.sub(r"^\d{4} Second Phase$", "Second Group Stage", r)
    r = re.sub(r"^Qualifying Third Round$", "Third Qualifying Round", r)
    r = re.sub(r"^League [Pp]hase", "League Phase", r)
    if re.match(r"^Round \d", r):
        r = re.sub(r"^Round (\d) ?", lambda m: ORD[m.group(1)] + " Round ", r).strip()
    r = re.sub(r"^(First|Second|Third|Fourth|Fifth|Sixth) round", r"\1 Round", r)
    r = re.sub(r"^(First|Second|Third|Fourth|Fifth|Sixth) qualifying round", r"\1 Qualifying Round", r)
    r = re.sub(r"^Quarter-?finals?", "Quarter-final", r)
    r = re.sub(r"^Semi-?finals?", "Semi-final", r)
    r = re.sub(r"(?<!/) [Rr]eplay$", " / Replay", r)  # "Fifth Round replay" -> "Fifth Round / Replay"
    r = re.sub(r"/ replay$", "/ Replay", r).replace("/ / ", "/ ")
    return r


def tidy_match(m):
    m["home"], m["away"] = tidy_team(m["home"]), tidy_team(m["away"])
    m["round"] = tidy_round(m.get("round"))
    if m.get("venue"):
        m["venue"] = tidy_venue(m["venue"])
    for key in ("goals", "cards"):
        for e in m.get(key, []):
            if e.get("team"):
                e["team"] = tidy_team(e["team"])
    for lu in m.get("lineups", []):
        lu["team"] = tidy_team(lu["team"])
    return m


def tidy_season_file(d):
    for m in d["matches"]:
        tidy_match(m)
    for t in d.get("tables", {}).values():
        for row in t:
            row["team"] = tidy_team(row["team"])
    return d


if __name__ == "__main__":
    changed = 0
    for f in sorted(glob.glob(str(Path(__file__).resolve().parent.parent / "data" / "season" / "*.json"))):
        text = Path(f).read_text()
        d = json.loads(text)
        before = json.dumps(d, sort_keys=True)
        tidy_season_file(d)
        if json.dumps(d, sort_keys=True) != before:
            # keep the file's existing layout: same indent as the original
            indent = 1 if text.startswith('{\n "') else (2 if text.startswith('{\n  "') else None)
            Path(f).write_text(json.dumps(d, ensure_ascii=False, indent=indent) + ("\n" if text.endswith("\n") else ""))
            changed += 1
            print("tidied", Path(f).name)
    print(changed, "file(s) changed")
