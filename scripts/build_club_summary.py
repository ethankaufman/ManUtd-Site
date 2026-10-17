#!/usr/bin/env python3
"""Works out the "every competition" summary from data/club/seasons.json and finals.json -> data/club/competitions.json.

Nothing new is fetched here: every number is counted from data that was already checked, so it cannot disagree with
the season-by-season table. Run it again after changing either file.

    python3 scripts/build_club_summary.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLUB = ROOT / "data" / "club"

RANK = {"Winners": 0, "Runners-up": 1, "SF": 2, "QF": 3, "Round of 16": 3.5, "R6": 4, "R5": 5, "R4": 6, "R3": 7, "R2": 8, "R1": 9, "Group": 10}
WORDS = {"Winners": "Winners", "Runners-up": "Runners-up", "SF": "Semi-finals", "QF": "Quarter-finals", "Round of 16": "Round of 16", "R6": "Sixth round", "R5": "Fifth round", "R4": "Fourth round", "R3": "Third round", "R2": "Second round", "R1": "First round", "Group": "Group stage"}


def best(results):
    results = [r for r in results if r in RANK]
    return min(results, key=lambda r: RANK[r]) if results else None


def cup_block(name, key, seasons, finals_comp, finals):
    entered = [s for s in seasons if s[key] not in ("", "—", "N/A")]
    results = [s[key] for s in entered]
    fs = [f for f in finals if f["comp"] == finals_comp]
    return {
        "name": name,
        "first": entered[0]["season"] if entered else None,
        "last": entered[-1]["season"] if entered else None,
        "seasons": len(entered),
        "titles": sum(1 for f in fs if f["result"] == "Won"),
        "finals": len(fs),
        "best": WORDS.get(best(results) or "", None),
    }


def main():
    seasons = json.loads((CLUB / "seasons.json").read_text())
    finals = json.loads((CLUB / "finals.json").read_text())

    # --- league: each division/era, with totals counted from the season rows
    def league(name, rows, extra=None):
        played = [r for r in rows if r["p"]]
        tot = {k: sum(r[k] for r in played) for k in ("p", "w", "d", "l", "gf", "ga")}
        return {
            "name": name,
            "first": rows[0]["season"],
            "last": rows[-1]["season"],
            "seasons": len(rows),
            "titles": sum(1 for r in rows if r["pos"] == "1st" and not r["promoted"]) if extra == "top" else sum(1 for r in rows if r["pos"] == "1st"),
            "played": tot["p"], "won": tot["w"], "drawn": tot["d"], "lost": tot["l"], "goalsFor": tot["gf"], "goalsAgainst": tot["ga"],
        }

    def years(rows):
        """'1921–22, 1930–31 and 1973–74' for the seasons in `rows` (the season each move took effect after)."""
        names = [r["season"].replace("-", "–") for r in rows]
        return ", ".join(names[:-1]) + " and " + names[-1] if len(names) > 1 else names[0]

    rel = [s for s in seasons if s["relegated"] and s["division"] == "Div 1"]
    pro = [s for s in seasons if s["promoted"] and s["division"] == "Div 2"]
    prem = [s for s in seasons if s["division"] == "Prem"]
    div1 = [s for s in seasons if s["division"] == "Div 1" and s["p"] and s["season"] != "1939-40"]
    div2 = [s for s in seasons if s["division"] == "Div 2"]
    alliance = [s for s in seasons if s["division"] in ("Alliance", "Combination")]
    leagues = [
        {**league("Premier League", prem), "note": "Since 1992. The 22 top clubs broke away from the Football League in 1992."},
        {**league("Football League First Division", div1, "top"), "note": "The top tier from 1892 to 1992 (the abandoned 1939–40 season is not counted)."},
        {**league("Football League Second Division", div2), "note": f"Relegated from the First Division in {years(rel)}; promoted back in {years(pro)}."},
        {**league("Football Alliance and Combination", alliance), "note": "Before United joined the Football League in 1892."},
    ]

    # --- cups
    cups = [
        cup_block("FA Cup", "fa_cup", seasons, "fa-cup", finals),
        cup_block("League Cup", "league_cup", seasons, "league-cup", finals),
    ]
    shield = [f for f in finals if f["comp"] == "community-shield"]
    cups.append(
        {
            "name": "Charity / Community Shield",
            "first": shield[0]["season"],
            "last": shield[-1]["season"],
            "seasons": len(shield),
            "titles": sum(1 for f in shield if f["result"] == "Won"),
            "finals": len(shield),
            "best": "Winners",
            "shared": sum(1 for f in shield if f["result"] == "Shared"),
        }
    )

    # --- Europe and the world: group the names in the season table into the competitions' lineages
    lineage = [
        ("European Cup / Champions League", ("European Cup", "Champions League"), "champions-league"),
        ("European Cup Winners' Cup", ("Cup Winners' Cup",), "cup-winners-cup"),
        ("Inter-Cities Fairs Cup / UEFA Cup / Europa League", ("Inter-Cities Fairs Cup", "UEFA Cup", "Europa League"), "europa-league"),
        ("UEFA Super Cup", ("Super Cup",), "uefa-super-cup"),
        ("Intercontinental Cup", ("Intercontinental Cup",), "intercontinental-cup"),
        ("FIFA Club World Cup / Championship", ("Club World Championship", "Club World Cup"), "club-world-cup"),
    ]
    europe = []
    for name, keys, comp in lineage:
        rows = []
        for s in seasons:
            for e in s["europe"]:
                head, _, res = e.partition(" – ")
                if head.strip() in keys:
                    rows.append((s["season"], res.strip()))
        fs = [f for f in finals if f["comp"] == comp]
        europe.append(
            {
                "name": name,
                "first": rows[0][0],
                "last": rows[-1][0],
                "seasons": len(rows),
                "titles": sum(1 for f in fs if f["result"] == "Won"),
                "finals": len(fs),
                "best": WORDS.get(best([r for _s, r in rows]) or "", None),
            }
        )
    ban = [s["season"] for s in seasons if any(e.startswith("Ban on") for e in s["europe"])]

    out = {"leagues": leagues, "cups": cups, "europe": europe, "europeBan": {"first": ban[0], "last": ban[-1], "seasons": len(ban)} if ban else None}
    (CLUB / "competitions.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    for group in ("leagues", "cups", "europe"):
        for c in out[group]:
            print(f"{c['name'][:50]:<50} {c['first']}..{c['last']} seasons={c['seasons']} titles={c.get('titles')} {c.get('best') or ''}")
    print("ban:", out["europeBan"])


if __name__ == "__main__":
    main()
