#!/usr/bin/env python3
"""Builds data/club/legends.json: each legend's record at United and the trophies he won there.

* Years, appearances and goals: data/club/legends_raw.json (Wikipedia's 100+ appearances list; see import_legends.py).
* Trophies: the "Manchester United" block of the Honours section of each player's Wikipedia article. EVERY entry is
  checked against our own trophy data (data/club/honours.json, itself checked against Wikipedia and our finals):
  the script stops with an error if a player is credited with a trophy United did not win that season.
* Individual awards at United: from our own awards data (the Premier League era) and the Ballon d'Or list.
* Portraits and stories are added in later steps (src/lib/legends-text.ts, public/legends/).

    python3 scripts/build_legends.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLUB = ROOT / "data" / "club"
CACHE = CLUB / "_cache"

# Wikipedia's wording -> our trophy key (the more specific words first)
CATEGORY = [
    ("Cup Winners", "cup-winners-cup"), ("Europa League", "europa-league"), ("UEFA Cup", "europa-league"),
    ("Champions League", "european-cup"), ("European Cup", "european-cup"),
    ("Super Cup", "super-cup"), ("Intercontinental", "intercontinental-cup"), ("Club World", "club-world-cup"),
    ("League Cup", "league-cup"), ("EFL Cup", "league-cup"), ("FA Cup", "fa-cup"), ("Charity Shield", "community-shield"), ("Community Shield", "community-shield"),
    ("Second Division", "second-division"), ("First Division", "league"), ("Premier League", "league"), ("Football League", "league"),
]
YEAR_LABELLED = {"community-shield", "super-cup", "intercontinental-cup", "club-world-cup"}


def united_block(text, title="Manchester United"):
    """The bullet lines under '''Manchester United''' in the Honours section."""
    i = text.find("==Honours==")
    if i < 0:
        i = text.find("== Honours ==")
    assert i >= 0, "no Honours section"
    sec = text[i:]
    sec = sec[: re.search(r"\n==[^=]", sec[5:]).start() + 5] if re.search(r"\n==[^=]", sec[5:]) else sec
    lines = sec.split("\n")
    out, on = [], False
    for ln in lines:
        head = re.match(r"^'''\s*([^']+?)\s*'''", ln)
        if head:
            on = head.group(1).strip() == title
            continue
        if on and ln.startswith("*"):
            out.append(ln)
    return out


def parse_line(ln):
    """'*[[FA Cup]]: [[1962–63 FA Cup|1962–63]]; runner-up: [[1956–57 FA Cup|1956–57]]' -> (competition text, [(label, shared)])."""
    ln = re.sub(r"<ref[^>]*/>", "", ln)  # self-closing references first
    ln = re.sub(r"<ref[^>]*>.*?</ref>", "", ln, flags=re.S)
    for _ in range(4):
        ln = re.sub(r"\{\{[^{}]*\}\}", "", ln)  # any citation template left behind
    star = ln.startswith("**")
    body = ln.lstrip("*").strip()
    shared_line = star and "shared" in body.lower()
    if ":" not in body and not star:
        return None
    comp, _, rest = body.partition(":")
    rest = re.split(r";\s*(?:runner|runners|third|fourth|semi)", rest, flags=re.I)[0]  # drop runner-up and the like
    comp_text = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", comp)
    years = re.findall(r"\[\[[^\]|]+\|(\d{4}(?:[–-]\d{2,4})?)\]\]|(?<![\d|])(\d{4}(?:[–-]\d{2,4})?)(?![\d|])", rest)
    labels = [a or b for a, b in years]
    shared_flags = [shared_line or bool(re.search(re.escape(l) + r"\]\]\s*\(shared\)", rest)) for l in labels]
    return comp_text, list(zip(labels, shared_flags))


def main():
    raw = json.loads((CLUB / "legends_raw.json").read_text())
    honours = json.loads((CLUB / "honours.json").read_text())
    ours, by_year = {}, {}
    for t in honours["trophies"]:
        key = {"premier-league": "league", "first-division": "league"}.get(t["key"], t["key"])
        for e in t["entries"]:
            ours[(key, e["label"].replace("–", "-"))] = (t["name"], e)
            if key not in YEAR_LABELLED:
                by_year[(key, e["year"])] = (t["name"], e)
    import unicodedata

    def norm(x):
        return unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode().lower().strip()

    problems, out = [], {}
    for slug, r in raw.items():
        text = (CACHE / f"{slug}.wikitext").read_text()
        trophies, other = [], []
        last_comp = None
        for ln in united_block(text):
            parsed = parse_line(ln)
            if not parsed:
                continue
            comp, items = parsed
            if ln.startswith("**") and not comp.strip():
                comp = last_comp or ""
            else:
                last_comp = comp
            if re.search(r"runner|finalist|third|fourth|semi", comp, re.I):
                continue  # runner-up and similar lines are not wins
            key = next((k for w, k in CATEGORY if w.lower() in comp.lower()), None)
            if not items:
                continue
            if not key:
                other.append({"text": f"{comp.strip()}: {', '.join(l for l, _s in items)}"})
                continue
            for label, shared in items:
                label = label.replace("–", "-").replace("1999-2000", "1999-00")
                if len(label) == 4 and key not in YEAR_LABELLED:  # Wikipedia gives some as a bare year, e.g. "European Cup 1968"
                    hit = by_year.get((key, int(label)))
                else:
                    hit = ours.get((key, label))
                if not hit:
                    problems.append(f"{slug}: {comp.strip()} {label} is not in our trophy data")
                    continue
                name, e = hit
                trophies.append({"key": key, "trophy": name, "label": e["label"], "shared": e["shared"], "listedShared": shared})
        youth = []
        for ln in united_block(text, "Manchester United Youth"):
            parsed = parse_line(ln)
            if parsed and parsed[1]:
                youth.append({"text": f"{parsed[0].strip()}: {', '.join(l for l, _s in parsed[1])}"})
        awards = [{"label": a["label"], "season": a["season"].replace("-", "–"), "detail": a["detail"]} for a in honours["awards"] if norm(a["winner"]) == norm(r["name"])]
        awards += [{"label": "Ballon d’Or", "season": str(b["year"]), "detail": ""} for b in honours["ballonDor"] if norm(b["player"]) == norm(r["name"])]
        out[slug] = {**r, "trophies": trophies, "otherHonours": other, "youthHonours": youth, "awards": awards}
        print(f"{r['name']:<22} {len(trophies):>3} trophies  awards: {len(awards):>2}  youth: {[y['text'] for y in youth]}")
    (CLUB / "legends.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print("\nPROBLEMS:", *problems, sep="\n  ")


if __name__ == "__main__":
    main()
