#!/usr/bin/env python3
"""Every manager (permanent, secretary-manager and caretaker) -> data/club/managers.json.

Source: Wikipedia's "List of Manchester United F.C. managers" (CC BY-SA): dates, matches/wins/draws/losses, goals,
honours, notes and the name of the picture file used on Wikipedia (checked later for a free licence).
Standard library only.

    python3 scripts/import_managers.py
"""
import json
import re
from pathlib import Path

import import_history as wp

ROOT = Path(__file__).resolve().parent.parent
PAGE = "List of Manchester United F.C. managers"
MONTHS = "January February March April May June July August September October November December".split()


def dts(s):
    """{{dts|format=dmy|1900|5|26}} -> ('1900', '1900-05-26')"""
    m = re.search(r"\{\{dts\|[^}]*?\|(\d{4})(?:\|(\d{1,2}))?(?:\|(\d{1,2}))?[^}]*\}\}", s)
    if not m:
        return None
    y, mo, d = m.group(1), m.group(2), m.group(3)
    iso = y + (f"-{int(mo):02d}" if mo else "") + (f"-{int(d):02d}" if d else "")
    return iso


def plain_date(s):
    """'5 January 2026' -> '2026-01-05'; ''present'' -> 'present'; a template -> via dts()."""
    if "{{dts" in s:
        return dts(s)
    if "present" in s.lower():
        return "present"
    m = re.search(r"(\d{1,2}) ([A-Z][a-z]+) (\d{4})", s)
    if m and m.group(2) in MONTHS:
        return f"{m.group(3)}-{MONTHS.index(m.group(2)) + 1:02d}-{int(m.group(1)):02d}"
    return None


def nation(s):
    m = re.search(r"\{\{([A-Z]{3})\}\}", s)
    if m:
        return m.group(1)
    m = re.search(r"\{\{flag\|([^|}]+)", s)
    return m.group(1) if m else None


def main():
    text = wp.fetch(PAGE)
    body = text[text.index("{|") : text.index("\n|}")]
    rows = re.split(r"^\|-.*$", body, flags=re.M)
    out = []
    for r in rows:
        nm = re.search(r"\{\{sortname\|([^|}]*)\|([^|}]*)", r)
        if not nm:
            continue
        name = f"{nm.group(1)} {nm.group(2)}".strip()
        label = re.search(r"\{\{sortname[^}]*\}\}[^\n]*?<small>\(([^)]*)\)</small>", r)
        role = label.group(1).lower() if label else None
        img = re.search(r"\[\[File:([^|\]]+)", r)
        wdl = re.search(r"\{\{WDL\|(\d+)\|(\d+)\|(\d+)\|(\d+)(?:\|for=(\d+)\|against=(\d+))?", r)
        lines = [l for l in r.split("\n") if l.startswith("|") and not l.startswith("|-")]
        # the two date lines are the 3rd and 4th cells (after the nationality); the second also carries the {{WDL}} line
        date_lines = [l for l in lines if "{{dts" in l or re.match(r"^\|\s*(?:\d{1,2} [A-Z][a-z]+ \d{4}|''?present''?)", l)]
        dates = [plain_date(l) for l in date_lines][:2]
        honours_line = next((l for l in lines if "<small>" in l), "")
        honours = [wp.clean(x) for x in re.split(r"<br\s*/?>", re.sub(r"<span[^>]*>.*?</span>", "", honours_line.split("<small>", 1)[1].split("</small>")[0]))] if honours_line else []
        notes_line = lines[-1] if lines else ""
        notes = re.findall(r'<ref(?: name="[^"]*")?(?: group="nb")?>(.*?)</ref>', notes_line, re.S)
        notes = [wp.clean(re.sub(r"\{\{[Cc]ite[^}]*\}\}", "", n)) for n in notes]
        out.append(
            {
                "name": name,
                "role": role,
                "player_manager": "<sup>p</sup>" in r,
                "country": nation("".join(lines[:2])),
                "from": dates[0] if dates else None,
                "to": dates[1] if len(dates) > 1 else None,
                "m": int(wdl.group(1)) if wdl else None,
                "w": int(wdl.group(2)) if wdl else None,
                "d": int(wdl.group(3)) if wdl else None,
                "l": int(wdl.group(4)) if wdl else None,
                "gf": int(wdl.group(5)) if wdl and wdl.group(5) else None,
                "ga": int(wdl.group(6)) if wdl and wdl.group(6) else None,
                "honours": [h for h in honours if h],
                "notes": [n for n in notes if n],
                "image": img.group(1).strip() if img else None,
            }
        )
    (ROOT / "data" / "club" / "managers_raw.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(len(out), "rows")
    for x in out:
        print(f"{x['name'][:24]:<24} {x['country'] or '?':<9} {x['from']}..{x['to']}  {x['m']}-{x['w']}-{x['d']}-{x['l']} {x['gf']}:{x['ga']} {'P' if x['player_manager'] else ' '} {x['role'] or '':<9} img={bool(x['image'])} h={len(x['honours'])} | {(x['notes'] or [''])[0][:60]}")


if __name__ == "__main__":
    main()
