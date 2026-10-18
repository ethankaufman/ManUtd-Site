#!/usr/bin/env python3
"""Looks on Wikimedia Commons for free-licensed photos of each current squad member in a Manchester United shirt.

A player's Commons category holds every photo of them (club, country, anywhere). We keep the files whose own
title, description or categories mention Manchester United, are freely licensed (CC BY, CC BY-SA, CC0, public
domain) and are at least 600px wide, and rank them newest and biggest first. Nothing is chosen automatically: the
candidates are written to a JSON file and downloaded as thumbnails so they can be looked at before one is picked.

    python3 scripts/find_kit_photos.py <output folder>
"""
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

import fetch_player_photos as f

ROOT = Path(__file__).resolve().parent.parent
UNITED = re.compile(r"manchester united|man\.? ?utd|man united|mufc", re.I)


def batch_info(titles):
    """imageinfo (licence, size, description, categories, date) for up to 50 file titles."""
    d = f.api("commons.wikimedia.org", action="query", titles="|".join(titles), prop="imageinfo", iiprop="url|extmetadata|size", iiurlwidth=640)
    out = []
    for p in d.get("query", {}).get("pages", []):
        ii = (p.get("imageinfo") or [None])[0]
        if not ii:
            continue
        m = ii.get("extmetadata", {})
        out.append(
            {
                "title": p["title"],
                "width": ii.get("width"),
                "height": ii.get("height"),
                "thumb": ii.get("thumburl"),
                "page": ii.get("descriptionurl"),
                "licence": f.strip(m.get("LicenseShortName", {}).get("value")),
                "licence_url": f.strip(m.get("LicenseUrl", {}).get("value")),
                "author": f.strip(m.get("Artist", {}).get("value")),
                "desc": f.strip(m.get("ImageDescription", {}).get("value"))[:240],
                "cats": f.strip(m.get("Categories", {}).get("value")),
                "date": f.strip(m.get("DateTimeOriginal", {}).get("value"))[:30],
            }
        )
    return out


def category_files(name):
    """File titles in the player's own category and in any sub-category that mentions Manchester United."""
    files = []
    d = f.api("commons.wikimedia.org", action="query", list="categorymembers", cmtitle=f"Category:{name}", cmtype="file", cmlimit=500)
    files += [x["title"] for x in d.get("query", {}).get("categorymembers", [])]
    d = f.api("commons.wikimedia.org", action="query", list="categorymembers", cmtitle=f"Category:{name}", cmtype="subcat", cmlimit=100)
    for sub in d.get("query", {}).get("categorymembers", []):
        if UNITED.search(sub["title"]):
            e = f.api("commons.wikimedia.org", action="query", list="categorymembers", cmtitle=sub["title"], cmtype="file", cmlimit=500)
            files += [x["title"] for x in e.get("query", {}).get("categorymembers", [])]
    return list(dict.fromkeys(files))


def search_files(name):
    out = []
    for q in (f"{name} Manchester United", f"{name} Man Utd"):
        d = f.api("commons.wikimedia.org", action="query", list="search", srsearch=q, srnamespace=6, srlimit=20)
        out += [x["title"] for x in d.get("query", {}).get("search", [])]
    return list(dict.fromkeys(out))


def main():
    out_dir = Path(sys.argv[1]).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)
    squad = json.loads((ROOT / "data" / "season" / "2026-27.json").read_text())["squad"]
    result = {}
    for p in squad:
        name = p["name"]
        titles = category_files(name)
        pool = [t for t in titles if re.search(r"\.(jpe?g|png)$", t, re.I)]
        infos = []
        for i in range(0, len(pool), 50):
            infos += batch_info(pool[i : i + 50])
        # keep files that mention United, with a free licence and enough pixels; also the surname must be in the text
        sur = name.split()[-1].lower()
        keep = []
        for x in infos:
            blob = " ".join([x["title"], x["desc"], x["cats"]])
            if f.OK_LICENCE.match(x["licence"] or "") and (x["width"] or 0) >= 600 and UNITED.search(blob) and sur in blob.lower():
                keep.append(x)
        # a search fallback if the category gave nothing
        if not keep:
            extra = [t for t in search_files(name) if re.search(r"\.(jpe?g|png)$", t, re.I) and t not in pool]
            for i in range(0, len(extra), 50):
                for x in batch_info(extra[i : i + 50]):
                    blob = " ".join([x["title"], x["desc"], x["cats"]])
                    if f.OK_LICENCE.match(x["licence"] or "") and (x["width"] or 0) >= 600 and UNITED.search(blob) and sur in blob.lower():
                        keep.append(x)
        keep.sort(key=lambda x: (x["date"] or "", x["width"] or 0), reverse=True)
        result[p["slug"]] = {"name": name, "candidates": keep[:6], "found": len(keep)}
        print(f"{name:<24} category files {len(pool):>4}  usable in United kit {len(keep):>3}")
    (out_dir / "candidates.json").write_text(json.dumps(result, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
