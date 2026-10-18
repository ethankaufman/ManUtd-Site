#!/usr/bin/env python3
"""Finds a free-licensed photo of each current squad member on Wikipedia / Wikimedia Commons.

Only photos under CC BY, CC BY-SA, CC0 or public domain are used (never fair-use or club/agency pictures).
For each player: Wikipedia's lead image -> licence and author from Commons -> a 640px copy in public/players/.
The credit for every photo is written to src/lib/player-photos.json, which the player pages show.
Players with no suitable photo are listed and simply get no picture.

    python3 scripts/fetch_player_photos.py            # look only, print what it would use
    python3 scripts/fetch_player_photos.py --download # also download and write the credits file
"""
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "ManUtd-Site fan project (https://github.com/ethankaufman/ManUtd-Site)"}
OK_LICENCE = re.compile(r"^(CC BY(-SA)? \d\.\d|CC0|Public domain)", re.I)


def api(host, **params):
    q = urllib.parse.urlencode({"format": "json", "formatversion": 2, **params})
    for attempt in range(5):
        try:
            time.sleep(1.2)
            with urllib.request.urlopen(urllib.request.Request(f"https://{host}/w/api.php?{q}", headers=UA), timeout=40) as r:
                return json.load(r)
        except Exception:  # noqa: BLE001 - rate limit or network blip: wait and retry
            time.sleep(4 * (attempt + 1))
    return {}


def strip(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def lead_image(name):
    """(page title, file name) for the footballer's Wikipedia article, or None."""
    for title in (name, f"{name} (footballer)"):
        d = api("en.wikipedia.org", action="query", titles=title, redirects=1, prop="pageimages|extracts", piprop="name", exintro=1, explaintext=1, exchars=400)
        for p in d.get("query", {}).get("pages", []):
            text = (p.get("extract") or "").lower()
            if p.get("missing") or "footballer" not in text and "football" not in text:
                continue
            if p.get("pageimage"):
                return p["title"], p["pageimage"]
            return p["title"], None
    return None


def tidy_author(a):
    """Commons' author field is sometimes messy: 'Unknown authorUnknown author', ' , ', long lists. Make it a clean credit."""
    a = re.sub(r"(Unknown author)+", "Unknown author", a)
    a = re.sub(r"\s+,", ",", a)
    a = re.split(r"\s/\s|;", a)[0].strip()
    if "Anefo" in a:
        a = re.sub(r"\s*,?\s*NL-HaNA.*$", "", a).strip(" ,")
    return a


def commons_info(filename):
    d = api("commons.wikimedia.org", action="query", titles=f"File:{filename}", prop="imageinfo", iiprop="url|extmetadata|size", iiurlwidth=640)
    pages = d.get("query", {}).get("pages", [])
    info = (pages[0].get("imageinfo") or [None])[0] if pages else None
    if not info:
        return None
    m = info.get("extmetadata", {})
    return {
        "thumb": info.get("thumburl"),
        "page": info.get("descriptionurl"),
        "width": info.get("width"),
        "licence": strip(m.get("LicenseShortName", {}).get("value")),
        "licence_url": strip(m.get("LicenseUrl", {}).get("value")),
        "author": tidy_author(strip(m.get("Artist", {}).get("value"))),
        "title": filename,
    }


def main():
    download = "--download" in sys.argv
    season = json.loads((ROOT / "data" / "season" / "2026-27.json").read_text())
    out_dir = ROOT / "public" / "players"
    credits = {}
    missing = []
    for p in season["squad"]:
        found = lead_image(p["name"])
        if not found or not found[1]:
            missing.append((p["name"], "no Wikipedia photo"))
            continue
        info = commons_info(found[1])
        if not info or not OK_LICENCE.match(info["licence"] or ""):
            missing.append((p["name"], f"licence not usable: {info['licence'] if info else 'unknown'}"))
            continue
        if info["author"].lower().startswith("derivative work") or not info["author"]:
            missing.append((p["name"], f"credit names only the cropper or no one: {info['author']!r}"))
            continue
        if (info["width"] or 0) < 300:
            missing.append((p["name"], f"photo too small ({info['width']}px)"))
            continue
        print(f"OK   {p['name']:<28} {info['licence']:<14} {info['width']}px  {info['title']}")
        credits[p["slug"]] = {k: info[k] for k in ("title", "author", "licence", "licence_url", "page")}
        if download and info["thumb"]:
            out_dir.mkdir(parents=True, exist_ok=True)
            time.sleep(1.5)
            req = urllib.request.Request(info["thumb"], headers=UA)
            (out_dir / f"{p['slug']}.jpg").write_bytes(urllib.request.urlopen(req, timeout=60).read())
    for name, why in missing:
        print(f"NONE {name:<28} {why}")
    print(f"\n{len(credits)} of {len(season['squad'])} players have a usable free photo.")
    if download:
        (ROOT / "src" / "lib" / "player-photos.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
