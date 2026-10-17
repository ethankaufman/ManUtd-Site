#!/usr/bin/env python3
"""Builds data/history/<season>.json for the seasons ESPN does not cover (1992-93 to 2000-01).

Source: the "<season> Manchester United F.C. season" pages on English Wikipedia (CC BY-SA), whose match
tables list every competitive and friendly match with date, opponent, venue, score, United's scorers and
attendance. Standard library only. The league results are then checked against the PL History Dashboard's
official match data (../PL-History-Dashboard/data/matches.csv) when that folder is present.

    python3 scripts/import_history.py            # all seasons 1992-93 .. 2000-01
    python3 scripts/import_history.py 1998       # just 1998-99, printed, nothing written
"""
import csv
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "history")
DASH = os.path.expanduser("~/PL-History-Dashboard/data/matches.csv")
UA = "ManUtd-Site fan project (https://github.com/ethankaufman/ManUtd-Site)"
UNITED = "Manchester United"

# section heading keyword -> (slug, name, kind)
SECTIONS = [
    ("premier league", ("premier-league", "Premier League", "league")),
    ("league", ("premier-league", "Premier League", "league")),
    ("fa cup", ("fa-cup", "FA Cup", "cup")),
    ("league cup", ("league-cup", "League Cup", "cup")),
    ("champions league", ("champions-league", "UEFA Champions League", "europe")),
    ("european cup", ("champions-league", "UEFA Champions League", "europe")),
    ("cup winners", ("cup-winners-cup", "UEFA Cup Winners' Cup", "europe")),
    ("uefa cup", ("europa-league", "UEFA Cup", "europe")),
    ("super cup", ("uefa-super-cup", "UEFA Super Cup", "europe")),
    ("intercontinental", ("intercontinental-cup", "Intercontinental Cup", "europe")),
    ("club world", ("club-world-cup", "FIFA Club World Championship", "europe")),
    ("charity shield", ("community-shield", "FA Charity Shield", "cup")),
    ("community shield", ("community-shield", "FA Community Shield", "cup")),
    ("friendl", ("friendlies", "Friendlies", "friendly")),
    ("pre-season", ("friendlies", "Friendlies", "friendly")),
    ("tour", ("friendlies", "Friendlies", "friendly")),
]


def fetch(title):
    q = urllib.parse.urlencode(
        {"action": "parse", "page": title, "prop": "wikitext", "format": "json", "formatversion": 2, "redirects": 1}
    )
    for attempt in range(4):
        try:
            req = urllib.request.Request("https://en.wikipedia.org/w/api.php?" + q, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)["parse"]["wikitext"]
        except Exception as e:  # noqa: BLE001 - network hiccup or rate limit; wait and retry
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(title)


def clean(s):
    """Wikitext cell -> plain text."""
    s = re.sub(r"<ref[^>]*/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"<br\s*/?>", " / ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    for _ in range(3):  # nested templates
        s = re.sub(r"\{\{(?:nowrap|nobr)\|([^{}]*)\}\}", r"\1", s, flags=re.I)
        s = re.sub(r"\{\{(?:pen|penalty)[^{}]*\}\}", "(pen.)", s, flags=re.I)
        s = re.sub(r"\{\{(?:og|o\.g\.)[^{}]*\}\}", "(o.g.)", s, flags=re.I)
        s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", s)  # [[a|b]] -> b
    s = re.sub(r"\[https?://\S+\s+([^\]]*)\]", r"\1", s)  # [url text] -> text
    s = re.sub(r"\[https?://\S+\]", "", s)
    s = s.replace("&nbsp;", " ").replace("&ndash;", "–").replace("'''", "").replace("''", "")
    s = re.sub(r"\s+", " ", s).strip(" /")
    return s.strip()


def tables(text):
    """Yield (heading_stack, table_text) for each wikitable."""
    heads = {}
    pos = 0
    for m in re.finditer(r"^(={2,4})\s*([^=\n]+?)\s*\1\s*$|^\{\|.*?^\|\}", text, re.M | re.S):
        if m.group(1):
            lvl = len(m.group(1))
            heads[lvl] = m.group(2)
            for k in [k for k in heads if k > lvl]:
                del heads[k]
        else:
            yield dict(heads), m.group(0)
        pos = m.end()


def competition_for(heads):
    """The most specific keyword wins ("League Cup" beats "League"); the top-level heading is tried first."""
    for lvl in sorted(heads) + sorted(heads, reverse=True):
        h = heads[lvl].lower()
        hits = [(len(key), val) for key, val in SECTIONS if key in h]
        if hits:
            return max(hits, key=lambda x: x[0])[1]
    return None


def split_cells(row):
    cells = []
    for line in row.split("\n"):
        if line.startswith("|") and not line.startswith("|-") and not line.startswith("|}"):
            for c in re.split(r"(?<!\[)\|\|", line[1:]):
                c = c.strip()
                m = re.match(r'^(?:[\w-]+\s*=\s*"[^"]*"\s*)+\|(?!\|)(.*)$', c, re.S)
                cells.append(m.group(1).strip() if m else c)
        elif cells and not line.startswith(("!", "|", "{")):
            cells[-1] += " " + line.strip()  # wrapped cell
    return cells


MONTHS = {m: i + 1 for i, m in enumerate("January February March April May June July August September October November December".split())}


def parse_date(s):
    m = re.search(r"(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})", s)
    if not m or m.group(2) not in MONTHS:
        return None
    return f"{m.group(3)}-{MONTHS[m.group(2)]:02d}-{int(m.group(1)):02d}"


def parse_goals(s):
    """'Solskjær (2) 39', 63', Yorke 45' (pen.)' -> [{'min','player','kind'}]. United's scorers only."""
    goals = []
    # "Bülent (o.g.) 88'" -> "Bülent 88' (o.g.)": the marker may come before or after the minute
    s = re.sub(r"\s*\((o\.g\.|og|pen\.?)\)\s*(\d+(?:\+\d+)?')", r" \2 (\1)", s)
    for m in re.finditer(r"([^\d,;()/][^\d,;()/]*?)\s*(?:\((\d)\))?\s*((?:\d+(?:\+\d+)?'(?:\s*\((?:pen\.?|o\.g\.?)\))?,?\s*)+)", s):
        player = m.group(1).strip(" ,;/&")
        if not player or player.lower() in ("pen", "pen.", "o.g.", "og"):
            continue
        for mm in re.finditer(r"(\d+(?:\+\d+)?)'(?:\s*\((pen\.?|o\.g\.?)\))?", m.group(3)):
            kind = "Goal"
            if mm.group(2):
                kind = "Penalty" if mm.group(2).startswith("pen") else "Own Goal"
            goals.append({"min": mm.group(1), "team": UNITED, "player": player, "kind": kind})
    return goals


def parse_table(tab, comp, season):
    rows = re.split(r"^\|-.*$", tab, flags=re.M)
    header_row = next((r for r in rows if re.search(r"^!", r, re.M)), "")
    head = [clean(c).lower() for c in re.findall(r"^!\s*(?:[^|\n]*\|(?!\|))?(.*)$", header_row, re.M)]
    rows = rows[rows.index(header_row) :] if header_row else rows
    if not any("opponent" in h for h in head) and not any("date" in h for h in head):
        return []

    def col(*names):
        for i, h in enumerate(head):
            if any(n in h for n in names):
                return i
        return None

    ci = {k: col(*v) for k, v in {"date": ("date",), "round": ("round",), "opp": ("opponent",), "ha": ("h / a", "h/a", "venue"), "res": ("result", "score"), "sc": ("scorer",), "att": ("attendance",)}.items()}
    if ci["date"] is None or ci["opp"] is None or ci["res"] is None:
        return []
    out = []
    for r in rows[1:]:
        cells = split_cells(r)
        if len(cells) <= max(v for v in ci.values() if v is not None) - 2:
            continue

        def get(k):
            i = ci[k]
            return clean(cells[i]) if i is not None and i < len(cells) else ""

        date = parse_date(get("date"))
        res = re.search(r"(\d+)\s*[–-]\s*(\d+)", get("res"))
        if not date or not res:
            continue
        ha = get("ha").upper()[:1] or "H"
        f, a = int(res.group(1)), int(res.group(2))
        pens = None
        pm = re.search(r"\(?(\d+)\s*[–-]\s*(\d+)\s*(?:p\b|pens|on pens)", get("res") + " " + get("round"))
        if pm:
            pens = [int(pm.group(1)), int(pm.group(2))]
        opp = get("opp")
        opp = re.sub(r"\s*\(.*?\)\s*$", "", opp).strip()
        home, away = (UNITED, opp) if ha in ("H", "N") else (opp, UNITED)
        hg, ag = (f, a) if ha in ("H", "N") else (a, f)
        att = re.sub(r"[^\d]", "", get("att"))
        out.append(
            {
                "date": date,
                "round": get("round"),
                "home": home,
                "away": away,
                "hg": hg,
                "ag": ag,
                "pens": pens,
                "neutral": ha == "N",
                "att": int(att) if att else None,
                "goals": parse_goals(get("sc")),
                "raw_result": get("res"),
            }
        )
    return out


def season_label(y):
    return "1999–2000" if y == 1999 else f"{y}–{str(y + 1)[2:]}"


def season_matches(y):
    label = season_label(y)
    title = f"{label} Manchester United F.C. season"
    text = fetch(title)
    comps, matches = {}, []
    for heads, tab in tables(text):
        comp = competition_for(heads)
        if not comp:
            continue
        got = parse_table(tab, comp, label)
        for m in got:
            m["comp"] = comp[0]
            comps[comp[0]] = comp
        matches += got
    matches.sort(key=lambda m: m["date"])
    for i, m in enumerate(matches, 1):
        m["id"] = f"wp-{y}-{i:02d}"
    return label, title, comps, matches


def check_league(y, matches):
    """Compare league results with the official dataset. Returns a list of problems."""
    if not os.path.exists(DASH):
        return ["(dashboard data not found, league check skipped)"]
    label = season_label(y)
    off = {}
    with open(DASH, newline="") as fh:
        for r in csv.DictReader(fh):
            if r["season"] == label and UNITED in (r["home"], r["away"]):
                off[r["date"]] = (r["home"], int(r["home_goals"]), int(r["away_goals"]))
    problems = []
    mine = [m for m in matches if m["comp"] == "premier-league"]
    if len(mine) != len(off):
        problems.append(f"league matches: ours {len(mine)} vs official {len(off)}")
    for m in mine:
        o = off.get(m["date"])
        if not o:
            problems.append(f"{m['date']} not in official data")
            continue
        ours_home_united = m["home"] == UNITED
        if (o[0] == UNITED) != ours_home_united or (o[1], o[2]) != (m["hg"], m["ag"]):
            problems.append(f"{m['date']} ours {m['hg']}-{m['ag']} ({m['home']}) vs official {o}")
    return problems


def main():
    arg = sys.argv[1:]
    years = [int(arg[0])] if arg else range(1992, 2001)
    for y in years:
        label, title, comps, matches = season_matches(y)
        counts = {}
        for m in matches:
            counts[m["comp"]] = counts.get(m["comp"], 0) + 1
        print(label, len(matches), counts)
        for p in check_league(y, matches):
            print("   CHECK:", p)
        if arg:
            for m in matches[:6]:
                print("  ", json.dumps(m, ensure_ascii=False))
            continue
        os.makedirs(OUT, exist_ok=True)
        doc = {
            "season": label,
            "source": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
            "competitions": [{"slug": c[0], "name": c[1], "kind": c[2]} for c in comps.values()],
            "matches": matches,
        }
        with open(os.path.join(OUT, f"{label}.json"), "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        time.sleep(1)


if __name__ == "__main__":
    main()
