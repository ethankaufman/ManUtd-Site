#!/usr/bin/env python3
"""Puts every penalty shoot-out score the right way round in data/season/*.json (safe to re-run).

Some Wikipedia tables write the winner's score first and some write United's first, and ESPN omits shoot-outs for
old games, so the imported scores were not always the right way round. The winner of a shoot-out always has the
HIGHER score, so we only need to know who won:
  * a final or Charity/Community Shield match: the result is known from data/club/finals.json,
  * any other cup tie: United won if they played again later in the same competition and season, otherwise they lost,
  * friendlies: the winner cannot be established, so the score is dropped and the match note says so.
Scores are stored as [home, away], like the goals.

    python3 scripts/fix_pens.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
U = "Manchester United"


def main():
    finals = json.loads((ROOT / "data" / "club" / "finals.json").read_text())
    known = {(f["date"], f["comp"]): f["result"] for f in finals}
    changed = 0
    for path in sorted((ROOT / "data" / "season").glob("*.json")):
        doc = json.loads(path.read_text())
        if not doc.get("past"):
            continue  # the live season comes straight from ESPN, shoot-outs included
        dirty = False
        for m in doc["matches"]:
            if not m.get("pens"):
                continue
            if m["comp"] == "friendlies":
                m["pens"] = None
                m["note"] = "Decided on penalties"
                dirty = True
                changed += 1
                print(f"{doc['season']} {m['kick'][:10]} friendly: score dropped")
                continue
            key = (m["kick"][:10], m["comp"])
            if key in known:
                won = known[key] == "Won"
            else:
                later = [x for x in doc["matches"] if x["comp"] == m["comp"] and x["kick"] > m["kick"] and x["state"] == "finished"]
                won = bool(later)
            hi, lo = max(m["pens"]), min(m["pens"])
            ours, theirs = (hi, lo) if won else (lo, hi)
            fixed = [ours, theirs] if m["home"] == U else [theirs, ours]
            if fixed != m["pens"]:
                print(f"{doc['season']} {m['kick'][:10]} {m['comp']}: {m['home']} v {m['away']} pens {m['pens']} -> {fixed} ({'won' if won else 'lost'})")
                m["pens"] = fixed
                dirty = True
                changed += 1
        if dirty:
            path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    print(f"{changed} matches changed")


if __name__ == "__main__":
    main()
