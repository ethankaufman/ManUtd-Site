#!/usr/bin/env python3
"""Looks on Wikimedia Commons for free-licensed portraits of each legend, preferring photos in a United shirt.

For each legend it gathers files from the person's Commons category and from searches, keeps the free-licensed ones
(CC BY, CC BY-SA, CC0, public domain) at least 500px wide whose title, description or categories mention the person,
and ranks those that mention Manchester United first, then by size. Nothing is chosen automatically: candidates are
downloaded as thumbnails with a contact sheet per legend so they can be looked at before one is picked.

    python3 scripts/find_legend_photos.py <output folder>
"""
import json
import re
import sys
import time
import unicodedata
import urllib.request
from pathlib import Path

import fetch_player_photos as f
import find_kit_photos as k

ROOT = Path(__file__).resolve().parent.parent


def norm(x):
    return unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode().lower()


def main():
    out_dir = Path(sys.argv[1]).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)
    legends = json.loads((ROOT / "data" / "club" / "legends_raw.json").read_text())
    result = {}
    for slug, r in legends.items():
        name = r["name"]
        sur = norm(name.split()[-1])
        titles = list(k.category_files(name))
        for q in (f"{name} Manchester United", f"{name} footballer", name):
            d = f.api("commons.wikimedia.org", action="query", list="search", srsearch=q, srnamespace=6, srlimit=25)
            titles += [x["title"] for x in d.get("query", {}).get("search", [])]
        titles = [t for t in dict.fromkeys(titles) if re.search(r"\.(jpe?g|png)$", t, re.I)]
        infos = []
        for i in range(0, len(titles), 50):
            infos += k.batch_info(titles[i : i + 50])
        keep = []
        for x in infos:
            blob = norm(" ".join([x["title"], x["desc"], x["cats"]]))
            if f.OK_LICENCE.match(x["licence"] or "") and (x["width"] or 0) >= 500 and sur in blob:
                x["united"] = bool(k.UNITED.search(blob))
                keep.append(x)
        keep.sort(key=lambda x: (x["united"], min(x["width"] or 0, 3000)), reverse=True)
        result[slug] = {"name": name, "found": len(keep), "candidates": keep[:8]}
        print(f"{name:<22} {len(titles):>3} files, {len(keep):>3} usable, {sum(1 for x in keep if x['united']):>3} mention United")
    (out_dir / "candidates.json").write_text(json.dumps(result, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
