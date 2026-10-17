#!/usr/bin/env python3
"""Builds data/club/honours.json: every trophy (with each win's details) and the individual awards.

* Trophies are DERIVED from data/club/seasons.json and finals.json (already checked), then compared with the honours
  table in Wikipedia's "Manchester United F.C." article. If the two disagree, this script stops with an error.
* Premier League-era awards (manager of the season, player of the season, PFA/FWA awards, Golden Boot...) come from
  ~/PL-History-Dashboard/data/awards.json (the project's own, audited data), United winners only.
* The Ballon d'Or comes from Wikipedia's winners table for every year, cross-checked with the dashboard for 1992 on.

    python3 scripts/build_honours.py
"""
import json
import re
from pathlib import Path

import import_history as wp

ROOT = Path(__file__).resolve().parent.parent
CLUB = ROOT / "data" / "club"
DASH = Path.home() / "PL-History-Dashboard" / "data"
U = "Manchester United"

seasons = {s["season"]: s for s in json.loads((CLUB / "seasons.json").read_text())}
finals = json.loads((CLUB / "finals.json").read_text())


def final_info(f):
    return {
        "date": f["date"], "opponent": f["opponent"], "score": f["score"], "aet": f["aet"], "pens": f["pens"], "venue": f["venue"], "city": f["city"],
        "attendance": f["attendance"], "replay": f["replay"], "page": f["page"], "title": f["title"],
    }


# one-off matches are labelled by calendar year, like Wikipedia does
YEAR_LABELLED = {"community-shield", "uefa-super-cup", "intercontinental-cup", "club-world-cup"}


def from_finals(comp):
    out = []
    for f in sorted(finals, key=lambda x: x["date"]):
        if f["comp"] == comp and f["result"] in ("Won", "Shared"):
            year = int(f["date"][:4])
            out.append({"season": f["season"], "year": year, "label": str(year) if comp in YEAR_LABELLED else f["season"].replace("-", "–"),
                        "shared": f["result"] == "Shared", "final": final_info(f), "table": None})
    return out


def from_league(division, prem=False):
    out = []
    for s in seasons.values():
        if s["pos"] == "1st" and s["division"] == division:
            out.append({"season": s["season"], "year": int(s["season"][:4]) + 1, "label": s["season"].replace("-", "–"), "shared": False, "final": None,
                        "table": {"p": s["p"], "w": s["w"], "d": s["d"], "l": s["l"], "gf": s["gf"], "ga": s["ga"], "pts": s["pts"]}})
    return out


# key, name, type, Wikipedia row it belongs to, entries
TROPHIES = [
    ("premier-league", "Premier League", "league", "First Division/Premier League", from_league("Prem")),
    ("first-division", "Football League First Division", "league", "First Division/Premier League", from_league("Div 1")),
    ("second-division", "Football League Second Division", "league", "Second Division", [e for e in from_league("Div 2")]),
    ("fa-cup", "FA Cup", "cup", "FA Cup", from_finals("fa-cup")),
    ("league-cup", "League Cup", "cup", "Football League Cup/EFL Cup", from_finals("league-cup")),
    ("community-shield", "Charity / Community Shield", "cup", "FA Charity Shield/FA Community Shield", from_finals("community-shield")),
    ("european-cup", "European Cup / Champions League", "europe", "European Cup/UEFA Champions League", from_finals("champions-league")),
    ("cup-winners-cup", "European Cup Winners' Cup", "europe", "European Cup Winners' Cup", from_finals("cup-winners-cup")),
    ("europa-league", "UEFA Europa League", "europe", "UEFA Europa League", from_finals("europa-league")),
    ("super-cup", "UEFA Super Cup", "europe", "UEFA Super Cup", from_finals("uefa-super-cup")),
    ("intercontinental-cup", "Intercontinental Cup", "europe", "Intercontinental Cup", from_finals("intercontinental-cup")),
    ("club-world-cup", "FIFA Club World Cup", "europe", "FIFA Club World Cup", from_finals("club-world-cup")),
]


def wikipedia_honours():
    """{row name: (count, [year labels])} from the honours table in the main article."""
    t = wp.fetch("Manchester United F.C.")
    i = t.index("==Honours==")
    j = t.index("{|", i)
    tab = t[j : t.index("\n|}", j)]
    out = {}
    for r in re.split(r"^\|-.*$", tab, flags=re.M):
        m = re.search(r'^!scope="row"\|\s*(.*)$', r, re.M)
        if not m:
            continue
        name = wp.clean(re.sub(r"<ref.*?(/>|</ref>)", "", m.group(1), flags=re.S))
        cells = [l for l in r.split("\n") if l.startswith("|") and not l.startswith(("|-", "|rowspan"))]
        count = int(re.search(r"\d+", wp.clean(cells[0][1:])).group())
        out[name] = (count, [y for y, _s in re.findall(r"\[\[[^\]|]+\|(\d{4}(?:–\d{2,4})?)\]\](\*?)", r)])
    return out


def check_trophies():
    wiki = wikipedia_honours()
    by_row = {}
    for key, name, _t, row, entries in TROPHIES:
        by_row.setdefault(row, []).extend(e["label"] for e in entries)
    problems = []
    for row, (count, years) in wiki.items():
        ours = by_row.get(row)
        if ours is None:
            problems.append(f"Wikipedia row not in our list: {row}")
            continue
        norm = lambda y: y.replace("1999–2000", "1999–00").replace("-", "–")
        if sorted(map(norm, ours)) != sorted(map(norm, years)) or len(ours) != count:
            problems.append(f"{row}: ours {len(ours)} {sorted(ours)} vs Wikipedia {count} {sorted(years)}")
    for row in by_row:
        if row not in wiki:
            problems.append(f"our row not on Wikipedia: {row}")
    assert not problems, "\n".join(problems)
    print("trophies agree with Wikipedia:", {row: len(v) for row, v in by_row.items()})


def ballon_dor():
    t = wp.fetch("Ballon d'Or")
    out = []
    pat = re.compile(r"\[\[(\d{4}) Ballon d'Or\|\d{4}\]\].*?background-color:gold\"\|'''1st'''\n\|[^\n]*?\[\[([^\]|]+)(?:\|[^\]]+)?\]\][^\n]*\n\|[^\n]*?\[\[([^\]|]+)\|([^\]]+)\]\]", re.S)
    for m in pat.finditer(t):
        year, player, _club_page, club = int(m.group(1)), m.group(2), m.group(3), m.group(4)
        if U in club or "Manchester United" in _club_page:
            out.append({"year": year, "player": player, "club": U})
    assert [x["year"] for x in out][:3] == [1964, 1966, 1968], out
    return out


def awards():
    a = json.loads((DASH / "awards.json").read_text())
    labels = {k: v["label"] for k, v in a["award_types"].items()}
    out = []
    for r in a["awards"]:
        if r.get("club") != U:
            continue
        detail = ""
        if r["award"] == "golden_boot":
            detail = f"{r.get('goals')} goals"
        elif r["award"] == "top_assists":
            detail = f"{r.get('assists')} assists"
        elif r["award"] == "golden_glove":
            detail = f"{r.get('clean_sheets', '')} clean sheets" if r.get("clean_sheets") else ""
        elif r["award"] == "goal_of_the_season":
            detail = f"v {r.get('opponent')} ({r.get('score')}), {r.get('date')}"
        out.append({"award": r["award"], "label": labels[r["award"]], "season": r["season"].replace("–", "-"), "winner": r["winner"], "detail": detail})
    out.sort(key=lambda x: (x["season"], x["label"]))
    return out


def main():
    check_trophies()
    bd = ballon_dor()
    # the dashboard's own Ballon d'Or per season (1992 on) must agree with Wikipedia
    dash = {h["ballon_dor_year"]: h["ballon_dor"] for h in json.loads((DASH / "honours.json").read_text()) if h.get("ballon_dor")}
    dash_us = {y: p["player"] for y, p in dash.items() if p.get("club") == U}
    wiki_us = {x["year"]: x["player"] for x in bd if x["year"] >= 1993}
    assert dash_us == wiki_us or all(wiki_us.get(y, "").split()[-1] == p.split()[-1] for y, p in dash_us.items()), (dash_us, wiki_us)
    out = {
        "trophies": [{"key": k, "name": n, "type": t, "entries": e} for k, n, t, _r, e in TROPHIES],
        "ballonDor": bd,
        "awards": awards(),
    }
    (CLUB / "honours.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print("ballon d'or:", bd)
    print("awards:", len(out["awards"]))
    for t in out["trophies"]:
        since = [e for e in t["entries"] if e["season"] >= "1992-93"]
        print(f"  {t['name']:<36} all-time {len(t['entries']):>2}  since 1992 {len(since):>2}")


if __name__ == "__main__":
    main()
