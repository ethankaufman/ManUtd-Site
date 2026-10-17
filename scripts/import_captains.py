#!/usr/bin/env python3
"""Club captains 1878 to now -> data/club/captains.json.

Source: Wikipedia's "List of Manchester United F.C. captains" (CC BY-SA): the dates, the captain, the flag code and
the honours won as captain. Standard library only.

    python3 scripts/import_captains.py
"""
import json
import re
from pathlib import Path

import import_history as wp

ROOT = Path(__file__).resolve().parent.parent
PAGE = "List of Manchester United F.C. captains"


def main():
    text = wp.fetch(PAGE)
    body = text[text.index("==Captains=="):]
    body = body[: body.index("==Vice-captains==")]
    table = body[body.index("{|"): body.index("|}")]
    rows = re.split(r"^\|-.*$", table, flags=re.M)
    out = []
    for r in rows:
        lines = [l for l in r.strip("\n").split("\n") if l.strip()]
        lines = [l for l in lines if not l.startswith(("!", "{|", "|}"))]
        if len(lines) < 2 or not re.match(r"^\|\s*\d{4}", lines[0]):
            continue
        dates = wp.clean(lines[0][1:])
        who = lines[1]
        flag = re.search(r"\{\{fbaicon\|([A-Z]{3})", who)
        name = wp.clean(re.sub(r"\{\{fbaicon[^}]*\}\}", "", re.sub(r'^\|\s*(?:scope="row"\s*\|)?', "", who)))
        honours = []
        for l in lines[2:]:
            if l.startswith("*"):
                honours.append(wp.clean(l.lstrip("*")))
        m = re.match(r"(\d{4})(?:\s*([–-])\s*(\d{4}|present)?)?", dates)
        out.append(
            {
                "from": int(m.group(1)),
                "to": (m.group(3) or ("present" if m.group(2) else m.group(1))) if m else None,
                "name": name or "Unknown",
                "country": flag.group(1) if flag else None,
                "honours": honours,
            }
        )
    (ROOT / "data" / "club" / "captains.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(len(out), "captains;", out[0]["from"], "to", out[-1]["to"])
    for c in out[-6:] + out[:3]:
        print(json.dumps(c, ensure_ascii=False)[:200])


if __name__ == "__main__":
    main()
