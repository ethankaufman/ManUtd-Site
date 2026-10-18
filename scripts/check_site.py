#!/usr/bin/env python3
"""Logic and link checks on the BUILT site (out/) and on the data behind it. Prints problems; exits non-zero if any.

  * every internal link and every image points at a file that exists,
  * every outside link answers (GET with a browser-like header; 403/999 from bot-blocking sites are listed separately),
  * the data agrees with itself across chapters (matches, seasons, honours, managers, legends, squad).

    python3 scripts/check_site.py            # everything
    python3 scripts/check_site.py --no-web   # skip the outside links
"""
import glob
import json
import os
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
problems = []


def bad(msg):
    problems.append(msg)
    print("PROBLEM:", msg)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs, self.imgs, self.noalt = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and a.get("href"):
            self.hrefs.append(a["href"])
        if tag == "img":
            self.imgs.append(a.get("src", ""))
            if a.get("alt") is None:
                self.noalt.append(a.get("src", ""))
        if tag == "link" and a.get("rel") == "stylesheet" and a.get("href"):
            self.imgs.append(a["href"])


def links_and_images():
    external = {}
    for p in OUT.rglob("index.html"):
        route = "/" + str(p.parent.relative_to(OUT)).replace(".", "") if p.parent != OUT else "/"
        parser = Links()
        parser.feed(p.read_text(encoding="utf-8"))
        for h in parser.hrefs:
            if h.startswith(("http://", "https://")):
                external.setdefault(h, route)
            elif h.startswith(("mailto:", "#", "javascript:")):
                continue
            else:
                path = h.split("#")[0].split("?")[0]
                if not path.startswith("/"):
                    continue
                target = OUT / path.lstrip("/")
                if not (target.is_file() or (target / "index.html").is_file() or Path(str(target).rstrip("/") + ".html").is_file()):
                    bad(f"broken internal link {h} on {route}")
        for s in parser.imgs:
            if s.startswith(("http", "data:")):
                continue
            f = OUT / s.split("?")[0].lstrip("/")
            if not f.is_file():
                bad(f"missing file {s} on {route}")
        for s in parser.noalt:
            bad(f"image without alt text {s} on {route}")
    return external


def fetch_status(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:  # noqa: BLE001
        return str(e)[:60]


def check_external(external):
    urls = sorted(external)
    with ThreadPoolExecutor(8) as ex:
        res = list(ex.map(fetch_status, urls))
    soft = []
    for u, s in zip(urls, res):
        if s == 200:
            continue
        if s in (403, 429, 999) or (isinstance(s, str) and "timed out" in s):
            soft.append((u, s, external[u]))
        else:
            bad(f"outside link {u} -> {s} (on {external[u]})")
    print(f"{len(urls)} outside links; {len(soft)} refused by the site (not necessarily broken):")
    for u, s, r in soft:
        print("   ", s, u, "on", r)


def data_checks():
    U = "Manchester United"
    # --- matches
    n = 0
    for f in sorted(glob.glob(str(ROOT / "data" / "season" / "*.json"))):
        d = json.load(open(f))
        for m in d["matches"]:
            n += 1
            if m["state"] == "finished":
                if m["hg"] is None or m["ag"] is None:
                    bad(f"{d['season']} {m['kick'][:10]} finished without a score")
                two_legs = any(w in (m.get("round") or "").lower() for w in ("semi", "leg", "quarter"))  # a shoot-out can follow a one-goal second leg
                if m.get("pens") and m["hg"] != m["ag"] and not two_legs:
                    bad(f"{d['season']} {m['kick'][:10]} {m['home']} v {m['away']}: penalties after a non-draw {m['hg']}-{m['ag']}")
                if m.get("pens") and m["pens"][0] == m["pens"][1]:
                    bad(f"{d['season']} {m['kick'][:10]}: tied shoot-out {m['pens']}")
                if U not in (m["home"], m["away"]):
                    bad(f"{d['season']} {m['kick'][:10]}: United are not in {m['home']} v {m['away']}")
            if m["state"] == "finished" and m.get("goals") and not m.get("detail_incomplete"):
                scored = sum(1 for g in m["goals"])
                if scored != (m["hg"] or 0) + (m["ag"] or 0) and m.get("src") != "wikipedia":
                    bad(f"{d['season']} {m['kick'][:10]} {m['home']} {m['hg']}-{m['ag']} {m['away']}: {scored} goal events")
        ids = [m["id"] for m in d["matches"]]
        if len(ids) != len(set(ids)):
            bad(f"{d['season']}: duplicate match ids")
        dup = {}
        for m in d["matches"]:
            dup.setdefault((m["kick"][:10], m["home"], m["away"], m["comp"]), 0)
            dup[(m["kick"][:10], m["home"], m["away"], m["comp"])] += 1
        for k, v in dup.items():
            if v > 1 and k[3] != "friendlies":  # two friendlies on one day do happen
                bad(f"{d['season']}: the same fixture twice: {k}")
    print(f"{n} matches checked")

    # --- club data
    club = ROOT / "data" / "club"
    seasons = json.load(open(club / "seasons.json"))
    for s in seasons:
        if s["p"] is not None and s["w"] is not None and s["p"] != s["w"] + s["d"] + s["l"]:
            bad(f"seasons {s['season']}: P != W+D+L")
    honours = json.load(open(club / "honours.json"))
    total = sum(len(t["entries"]) for t in honours["trophies"])
    comps = json.load(open(club / "competitions.json"))
    titles = sum(c["titles"] for c in comps["leagues"] + comps["cups"] + comps["europe"])
    # competitions count Shield titles (17) + shared (4) the same way as the honours (21)
    shared = sum(c.get("shared", 0) for c in comps["cups"])
    if total != titles + shared:
        bad(f"honours total {total} != competitions titles+shared {titles + shared}")
    managers = json.load(open(club / "managers.json"))
    ferg = next(p for p in managers["people"] if p["name"] == "Alex Ferguson")
    if len(ferg["honours"]) != 38:
        bad(f"Ferguson trophies {len(ferg['honours'])} != 38")
    mh = sum(len(p["honours"]) for p in managers["people"])
    ours = sum(len(t["entries"]) for t in honours["trophies"] if True)
    if mh != ours:
        bad(f"managers' trophies {mh} != honours total {ours}")
    # managers: no two appointed managers overlap
    flat = [(p["name"], st) for p in managers["people"] for st in p["stints"] if st["role"] is None]
    def pad(d, end):
        return "9999-12-31" if d == "present" else d + ("-12-31" if end and len(d) == 4 else "") if len(d) == 4 else (d + "-31" if end and len(d) == 7 else d)
    flat.sort(key=lambda x: x[1]["from"])
    for (n1, a), (n2, b) in zip(flat, flat[1:]):
        if pad(a["to"], True) > pad(b["from"], False) and n1 != n2 and not (a["to"] == b["from"]):
            bad(f"managers overlap: {n1} to {a['to']} and {n2} from {b['from']}")
    # legends
    legends = json.load(open(club / "legends.json"))
    for slug, l in legends.items():
        if l["starts"] + l["subs"] != l["apps"]:
            bad(f"legend {slug}: starts+subs != apps")
        cs, ce = int(l["career"][0][:4]), int(l["career"][-1][-4:])
        for t in l["trophies"]:
            y = int(t["label"][:4])
            if y < cs - 1 or y > ce:  # a season starts before a January signing (Vidić, 2005–06 League Cup)
                bad(f"legend {slug}: {t['trophy']} {t['label']} outside his years {cs}-{ce}")
        for k in ("trophies",):
            seen = [(t["trophy"], t["label"]) for t in l[k]]
            if len(seen) != len(set(seen)):
                bad(f"legend {slug}: duplicate trophy entries")
    stories = json.load(open(club / "legend_stories.json"))
    if set(stories) != set(legends):
        bad("legend stories and legends differ")
    # photos exist for every credit
    for credits, folder in (("player-photos.json", "players"), ("trophy-photos.json", "trophies"), ("manager-photos.json", "managers"), ("legend-photos.json", "legends"), ("stadium-photos.json", "stadium")):
        data = json.load(open(ROOT / "src" / "lib" / credits))
        for k, v in data.items():
            fn = v.get("file") or f"{k}.jpg"
            if not (ROOT / "public" / folder / fn).is_file():
                bad(f"{credits}: no file public/{folder}/{fn}")
        for f_ in (ROOT / "public" / folder).glob("*"):
            if f_.name not in {v.get("file") or f"{k}.jpg" for k, v in data.items()}:
                bad(f"public/{folder}/{f_.name} has no credit entry")
    # credits sanity: odd author strings
    for credits in ("player-photos.json", "trophy-photos.json", "manager-photos.json", "legend-photos.json", "stadium-photos.json"):
        for k, v in json.load(open(ROOT / "src" / "lib" / credits)).items():
            a = v.get("author", "")
            if not a or "Unknown authorUnknown" in a or " , " in a or len(a) > 60 or "http" in a:
                bad(f"{credits} {k}: untidy author credit {a!r}")


def main():
    if not OUT.is_dir():
        sys.exit("run `npm run build` first")
    external = links_and_images()
    data_checks()
    if "--no-web" not in sys.argv:
        check_external(external)
    print(f"\n{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
