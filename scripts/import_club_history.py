#!/usr/bin/env python3
"""Season-by-season record 1886-87 to now -> data/club/seasons.json.

Source: Wikipedia's "List of Manchester United F.C. seasons" (CC BY-SA). The table's cells can span several rows
(for example "N/A" for a cup that did not exist yet), so each row is placed into numbered column slots, skipping the
slots a cell above is still spanning. Standard library only.

    python3 scripts/import_club_history.py
"""
import json
import re
import sys
from pathlib import Path

import import_history as wp

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "club"
PAGE = "List of Manchester United F.C. seasons"

# column slots after the Season cell
COLS = ["division", "tier", "p", "w", "d", "l", "gf", "ga", "pts", "pos", "fa_cup", "league_cup", "shield", "europe", "scorers", "goals"]


def footnotes(s):
    """The text of each {{efn|...}} footnote in a cell (named repeats that carry no text are skipped)."""
    out = []
    i = 0
    while True:
        i = s.find("{{efn|", i)
        if i < 0:
            return out
        depth, j = 0, i
        while j < len(s):
            if s[j : j + 2] == "{{":
                depth += 1
                j += 2
            elif s[j : j + 2] == "}}":
                depth -= 1
                j += 2
                if depth == 0:
                    break
            else:
                j += 1
        body = s[i + 6 : j - 2]
        body = re.sub(r"^name\s*=\s*[^|]*\|?", "", body).strip()
        if body:
            out.append(body)
        i = j


def fix_templates(s):
    """Unwrap the sorting templates this table uses, then hand the rest to the shared cleaner."""
    s = re.sub(r"\{\{efn\|(?:[^{}]|\{\{[^{}]*\}\})*\}\}", "", s)  # footnotes
    s = re.sub(r"<hr\s*/?>", " / ", s)
    s = re.sub(r"\{\{plainlist\s*\|\s*(?:1\s*=)?((?:[^{}]|\{\{[^{}]*\}\})*)\}\}", lambda m: " / ".join(x.strip().lstrip("*").strip() for x in re.split(r"\n|\s*\*\s*", m.group(1)) if x.strip().lstrip("*").strip()), s)
    for _ in range(3):
        s = re.sub(r"\{\{sortname\|([^|{}]*)\|([^|{}]*)[^{}]*\}\}", r"\1 \2", s)
        s = re.sub(r"\{\{sort\|[^|{}]*\|([^{}]*)\}\}", r"\1", s)
    return s


def split_attrs(cell):
    """'rowspan=2 | text' -> ({'rowspan': 2}, 'text'). The first | outside [[ ]] and {{ }} separates attributes."""
    depth = 0
    i = 0
    while i < len(cell):
        two = cell[i : i + 2]
        if two in ("[[", "{{"):
            depth += 1
            i += 2
            continue
        if two in ("]]", "}}"):
            depth -= 1
            i += 2
            continue
        if cell[i] == "|" and depth == 0:
            attrs = cell[:i]
            if "=" in attrs and "[" not in attrs and "{" not in attrs:
                found = {k.lower(): int(v) for k, v in re.findall(r'(rowspan|colspan)\s*=\s*"?(\d+)"?', attrs, re.I)}
                return found, cell[i + 1 :]
            return {}, cell
        i += 1
    return {}, cell


def row_cells(row):
    cells = []
    for line in row.split("\n"):
        if line.startswith(("|}", "|+")):
            continue
        if line.startswith(("|", "!")):
            body = line[1:]
            # split on || at depth 0 only
            parts, depth, cur, i = [], 0, "", 0
            while i < len(body):
                two = body[i : i + 2]
                if two in ("[[", "{{"):
                    depth += 1
                elif two in ("]]", "}}"):
                    depth -= 1
                if two == "||" and depth == 0:
                    parts.append(cur)
                    cur = ""
                    i += 2
                    continue
                cur += body[i]
                i += 1
            parts.append(cur)
            cells += [split_attrs(p.strip()) for p in parts]
        elif cells and line.strip():
            attrs, text = cells[-1]
            cells[-1] = (attrs, text + " " + line.strip())
    return cells


def place(cells, spans):
    """Put a row's cells into the numbered slots (0 = season), honouring spans from rows above."""
    out = {}
    own = []
    it = iter(cells)
    for c in range(len(COLS)):
        if c in spans and spans[c][0] > 0:
            out[COLS[c]] = spans[c][1]
            spans[c][0] -= 1
            continue
        try:
            attrs, text = next(it)
        except StopIteration:
            break
        own.append(text)
        span = attrs.get("colspan", 1)
        for k in range(span):
            if c + k < len(COLS):
                out[COLS[c + k]] = text
                if attrs.get("rowspan", 1) > 1:
                    spans[c + k] = [attrs["rowspan"] - 1, text]
    return out, own


def num(s):
    m = re.search(r"-?\d+", s or "")
    return int(m.group()) if m else None


def tidy(s):
    s = wp.clean(fix_templates(s or ""))
    return re.sub(r"\s+", " ", s).strip()


def parse():
    text = wp.fetch(PAGE)
    body = text[text.index("==Seasons=="):]
    body = body[: body.index("==Notes==")] if "==Notes==" in body else body
    rows = re.split(r"^\|-.*$", body, flags=re.M)
    spans = {}
    seasons = []
    for r in rows:
        m = re.search(r"^!\s*(?:scope=\"row\"\s*\|\s*)?((?:\{\{nowrap\|)?(?:\[\[)?\d{4}[–-]\d{2,4}[^\n]*)$", r, re.M)
        if not m:
            continue
        label = re.search(r"(\d{4})[–-](\d{2,4})", tidy(m.group(1)))
        if not label:
            continue
        first = int(label.group(1))
        # drop the season header line, keep the rest
        rest = "\n".join(line for line in r.split("\n") if not line.startswith("!"))
        cells = row_cells(rest)
        raw, own = place(cells, spans)
        div_raw = raw.get("division", "")
        seasons.append({"first": first, "raw": raw, "div_raw": div_raw, "hdr": m.group(1), "own": own})
    return seasons


def merge_plain(items):
    """'Ban on / English teams' (a <br> inside one cell) is one entry, not two: join pieces that have no ' – ' result."""
    out, buf = [], []
    for x in items:
        if " – " in x:
            out.append(x)
        else:
            buf.append(x)
    return out + ([" ".join(buf)] if buf else [])


def build():
    out = []
    for s in parse():
        raw = s["raw"]
        y = s["first"]
        season = f"{y}-{str(y + 1)[2:]}" if y != 1999 else "1999-00"
        div = tidy(raw.get("division", ""))
        item = {
            "season": season,
            "club": "Newton Heath" if y < 1902 else "Manchester United",
            "division": re.sub(r"\s*[↑↓]", "", div).strip(),
            "promoted": "↑" in div,
            "relegated": "↓" in div,
            "tier": num(tidy(raw.get("tier", ""))),
            "p": num(tidy(raw.get("p", ""))),
            "w": num(tidy(raw.get("w", ""))),
            "d": num(tidy(raw.get("d", ""))),
            "l": num(tidy(raw.get("l", ""))),
            "gf": num(tidy(raw.get("gf", ""))),
            "ga": num(tidy(raw.get("ga", ""))),
            "pts": num(tidy(raw.get("pts", ""))),
            "pos": tidy(raw.get("pos", "")),
            "fa_cup": tidy(raw.get("fa_cup", "")),
            "league_cup": tidy(raw.get("league_cup", "")),
            "shield": tidy(raw.get("shield", "")),
            "europe": merge_plain([x.strip() for x in tidy(raw.get("europe", "")).split(" / ") if x.strip() and x.strip() != "N/A"]),
            "finals": [
                {"page": t.strip(), "result": r}
                for text in [raw.get(k, "") for k in ("fa_cup", "league_cup", "shield", "europe")]
                for t, r in re.findall(r"\[\[([^\]|]+)\|(Winners|Runners-up|Shared|Joint winners)\]\]", text)
            ],
            "notes": list(dict.fromkeys(tidy(n) for text in [s["hdr"], *s["own"]] for n in footnotes(text))),
            "scorers": [x.strip() for x in tidy(raw.get("scorers", "")).split(" / ") if x.strip()],
            "goals": num(tidy(raw.get("goals", ""))),
        }
        out.append(item)
    return out


def main():
    data = build()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "seasons.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(data)} seasons, {data[0]['season']} .. {data[-1]['season']}")
    if "-v" in sys.argv:
        for it in data[:3] + data[-3:]:
            print(json.dumps(it, ensure_ascii=False))


if __name__ == "__main__":
    main()
