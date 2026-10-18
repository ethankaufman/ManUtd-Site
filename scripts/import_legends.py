#!/usr/bin/env python3
"""Each legend's years at United, appearances and goals -> data/club/legends_raw.json.

Source: Wikipedia's "List of Manchester United F.C. players (100+ appearances)" (CC BY-SA, figures from MUFCinfo):
years at the club, starts, substitute appearances, total appearances and goals in ALL competitions.
The legends' list itself is ours (see LEGENDS). Standard library only.

    python3 scripts/import_legends.py
"""
import json
import re
from pathlib import Path

import import_history as wp

ROOT = Path(__file__).resolve().parent.parent
PAGE = "List of Manchester United F.C. players (100+ appearances)"

# slug, name as the list spells it, Wikipedia article title
LEGENDS = [
    ("duncan-edwards", "Duncan Edwards", "Duncan Edwards"),
    ("bobby-charlton", "Bobby Charlton", "Bobby Charlton"),
    ("denis-law", "Denis Law", "Denis Law"),
    ("george-best", "George Best", "George Best"),
    ("nobby-stiles", "Nobby Stiles", "Nobby Stiles"),
    ("bryan-robson", "Bryan Robson", "Bryan Robson"),
    ("mark-hughes", "Mark Hughes", "Mark Hughes"),
    ("peter-schmeichel", "Peter Schmeichel", "Peter Schmeichel"),
    ("eric-cantona", "Eric Cantona", "Eric Cantona"),
    ("roy-keane", "Roy Keane", "Roy Keane"),
    ("gary-neville", "Gary Neville", "Gary Neville"),
    ("paul-scholes", "Paul Scholes", "Paul Scholes"),
    ("ryan-giggs", "Ryan Giggs", "Ryan Giggs"),
    ("david-beckham", "David Beckham", "David Beckham"),
    ("ole-gunnar-solskjaer", "Ole Gunnar Solskjær", "Ole Gunnar Solskjær"),
    ("cristiano-ronaldo", "Cristiano Ronaldo", "Cristiano Ronaldo"),
    ("wayne-rooney", "Wayne Rooney", "Wayne Rooney"),
    ("rio-ferdinand", "Rio Ferdinand", "Rio Ferdinand"),
    ("nemanja-vidic", "Nemanja Vidić", "Nemanja Vidić"),
    ("edwin-van-der-sar", "Edwin van der Sar", "Edwin van der Sar"),
]


def parse_list():
    text = wp.fetch(PAGE)
    body = text[text.index("List of Manchester United F.C. players with at least 100 appearances") :]
    out = {}
    for row in re.split(r"^\|-.*$", body, flags=re.M):
        nm = re.search(r"\{\{sortname\|([^|}]*)\|([^|}]*)", row)
        if not nm:
            continue
        name = f"{nm.group(1)} {nm.group(2)}".strip()
        cells = re.sub(r"<ref.*?</ref>", "", row, flags=re.S)
        nat = re.search(r"\{\{fba\|([A-Z]{3})", cells)
        pos = re.search(r"\{\{sort\|\d\|([A-Z]+)\}\}", cells)
        nums = re.search(r"(\d{4}(?:–\d{4})?(?:<br\s*/?>\d{4}(?:–\d{4})?)*)\|\|(\d+)\|\|(\d+)\|\|(\d+)\|\|(\d+)", cells)
        if not nums:
            continue
        out.setdefault(name, []).append(
            {"nation": nat.group(1) if nat else None, "pos": pos.group(1) if pos else None, "spells": re.split(r"<br\s*/?>", nums.group(1)), "starts": int(nums.group(2)), "subs": int(nums.group(3)), "apps": int(nums.group(4)), "goals": int(nums.group(5))}
        )
    return out


def main():
    allp = parse_list()
    print(len(allp), "players parsed")
    out = {}
    for slug, name, title in LEGENDS:
        rows = allp.get(name)
        assert rows and len(rows) == 1, (name, rows)
        r = rows[0]
        assert r["starts"] + r["subs"] == r["apps"], (name, r)
        out[slug] = {"name": name, "wikipedia": title, **r}
        print(f"{name:<22} {' + '.join(r['spells']):<26} {r['apps']:>4} apps {r['goals']:>3} goals  {r['pos']} {r['nation']}")
    (ROOT / "data" / "club" / "legends_raw.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
