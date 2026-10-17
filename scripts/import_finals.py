#!/usr/bin/env python3
"""Every final (and Charity/Community Shield match) United have played -> data/club/finals.json.

The list of matches comes from the links in data/club/seasons.json (the season table links each "Winners" and
"Runners-up" to the final's own Wikipedia page). Each page's match infobox gives the date, venue, city, teams and score.
Source: Wikipedia (CC BY-SA). Standard library only.

    python3 scripts/import_finals.py
"""
import json
import re
import time
from datetime import datetime
from pathlib import Path

import import_history as wp

ROOT = Path(__file__).resolve().parent.parent
CLUB = ROOT / "data" / "club"
U = "Manchester United"

# (regex on the page title, slug, name)
COMPS = [
    (r"FA Cup final", "fa-cup", "FA Cup"),
    (r"(Football League|EFL) Cup final", "league-cup", "League Cup"),
    (r"FA (Charity|Community) Shield", "community-shield", "Charity / Community Shield"),
    (r"European Cup Winners.? Cup final", "cup-winners-cup", "European Cup Winners' Cup"),
    (r"(UEFA Champions League|European Cup) final", "champions-league", "European Cup / Champions League"),
    (r"UEFA Europa League final", "europa-league", "UEFA Europa League"),
    (r"(UEFA|European) Super Cup", "uefa-super-cup", "UEFA Super Cup"),
    (r"Intercontinental Cup", "intercontinental-cup", "Intercontinental Cup"),
    (r"FIFA Club World Cup final", "club-world-cup", "FIFA Club World Cup"),
]


def infobox(text):
    """The first match infobox on the page as {field: raw value}."""
    i = text.find("{{Infobox football match")
    if i < 0:
        return {}
    depth, j = 0, i
    while j < len(text):
        if text[j : j + 2] == "{{":
            depth += 1
            j += 2
        elif text[j : j + 2] == "}}":
            depth -= 1
            j += 2
            if depth == 0:
                break
        else:
            j += 1
    body = text[i + 2 : j - 2]
    out = {}
    for part in re.split(r"\n\s*\|\s*(?=[A-Za-z_0-9]+\s*=)", body)[1:]:  # fields start a line; | inside a template does not
        k, _, v = part.partition("=")
        out[k.strip()] = v.strip()
    return out


def parse_date(s):
    m = re.search(r"[Ss]tart[- ]date[^|]*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})", s)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    s = wp.clean(s)
    for fmt in ("%d %B %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(re.sub(r"\s+", " ", s)[:30].strip(), fmt).date().isoformat()
        except ValueError:
            pass
    m = re.search(r"(\d{1,2}) ([A-Z][a-z]+) (\d{4})", s)
    if m:
        try:
            return datetime.strptime(" ".join(m.groups()), "%d %B %Y").date().isoformat()
        except ValueError:
            pass
    return None


def num(s):
    m = re.search(r"\d+", re.sub(r"(?<=\d),(?=\d)", "", wp.clean(s or "")))
    return int(m.group()) if m else None


def leg(ib, suffix, ours_is_1):
    """One match (the final, or its replay) -> dict. `suffix` is '' for a single match or '1'/'2' for final/replay."""
    g = lambda k: ib.get(k + suffix, ib.get(k, "")) if suffix == "" else ib.get(k + suffix, "")
    s1, s2 = num(g("team1score")), num(g("team2score"))
    if s1 is None or s2 is None:
        return None
    details = wp.clean(g("details"))
    pens = None
    pm = re.search(r"(\d+)\s*[–-]\s*(\d+)\s*(?:on )?penalt", details + " " + wp.clean(ib.get("details", "")))
    if not pm:
        a, b = num(ib.get("team1penaltyscore", "")), num(ib.get("team2penaltyscore", ""))
        pm = None
        if a is not None and b is not None:
            pens = [a, b] if ours_is_1 else [b, a]
    if pm:
        a, b = int(pm.group(1)), int(pm.group(2))
        pens = [a, b]  # as written: the winner's score is not always first, fixed below
    return {
        "date": parse_date(g("date")),
        "venue": wp.clean(g("stadium")),
        "city": wp.clean(g("city")),
        "us": s1 if ours_is_1 else s2,
        "them": s2 if ours_is_1 else s1,
        "aet": "extra time" in details.lower(),
        "pens_raw": pens,
        "details": details,
        "attendance": num(g("attendance")),
        "referee": re.sub(r"\s*\(.*\)$", "", wp.clean(g("referee"))),
    }


def build():
    seasons = json.loads((CLUB / "seasons.json").read_text())
    out = []
    for s in seasons:
        for f in s["finals"]:
            title = f["page"]
            comp = next(((slug, name) for rx, slug, name in COMPS if re.search(rx, title, re.I)), None)
            if not comp:
                print("  ?? no competition for", title)
                continue
            text = wp.fetch(title)
            time.sleep(1.1)
            ib = infobox(text)
            if not ib:
                print("  ?? no infobox on", title)
                continue
            t1, t2 = (re.sub(r"\s*/\s*", " ", wp.clean(ib.get(k, ""))) for k in ("team1", "team2"))
            ours_is_1 = U in t1
            if not ours_is_1 and U not in t2:
                print("  ?? United not in infobox of", title, t1, t2)
                continue
            opp = t2 if ours_is_1 else t1
            multi = "team1score1" in ib
            first = leg(ib, "1" if multi else "", ours_is_1)
            replay = leg(ib, "2", ours_is_1) if multi else None
            second_kind = wp.clean(ib.get("secondleg", "")).lower() if multi else ""
            first_kind = wp.clean(ib.get("firstleg", "")).lower() if multi else ""
            if not first:
                print("  ?? no score on", title)
                continue
            deciding = replay or first
            if first["pens_raw"] or (replay and replay["pens_raw"]):
                src = replay if (replay and replay["pens_raw"]) else first
                a, b = src["pens_raw"]
                # the text reads "<winner> won a-b on penalties": put United's score first by who won
                won = deciding["us"] > deciding["them"] or (deciding["us"] == deciding["them"] and f["result"] == "Winners")
                hi, lo = max(a, b), min(a, b)
                pens = [hi, lo] if won else [lo, hi]
            else:
                pens = None
            result = {"Winners": "Won", "Runners-up": "Lost", "Shared": "Shared", "Joint winners": "Shared"}[f["result"]]
            out.append(
                {
                    "season": s["season"],
                    "comp": comp[0],
                    "comp_name": comp[1],
                    "title": wp.clean(ib.get("title", title)),
                    "result": result,
                    "opponent": opp,
                    "date": first["date"],
                    "venue": first["venue"],
                    "city": first["city"],
                    "score": [first["us"], first["them"]],
                    "aet": first["aet"],
                    "attendance": first["attendance"],
                    "referee": first["referee"],
                    "pens": pens if not replay else None,
                    "first_kind": first_kind or None,
                    "replay": (
                        {
                            "kind": second_kind or "replay",
                            "date": replay["date"], "venue": replay["venue"], "city": replay["city"],
                            "score": [replay["us"], replay["them"]], "aet": replay["aet"],
                            "attendance": replay["attendance"], "pens": pens,
                        }
                        if replay
                        else None
                    ),
                    "page": "https://en.wikipedia.org/wiki/" + title.replace(" ", "_"),
                }
            )
    out.sort(key=lambda x: (x["date"] or "", x["title"]))
    return out


def main():
    data = build()
    (CLUB / "finals.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(data)} finals/shield matches written")


if __name__ == "__main__":
    main()
