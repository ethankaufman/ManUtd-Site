#!/usr/bin/env python3
"""Downloads the free-licensed photos for the Old Trafford chapter -> public/stadium/ and src/lib/stadium-photos.json.

Every file is on Wikimedia Commons under CC BY, CC BY-SA or the public domain and was picked by eye. There are no
free pictures of Bank Street (the second ground) or of the new stadium design (the club's and the architects' images
are not free to use), so the page says so instead. The credit for each picture is saved with it.

    python3 scripts/fetch_stadium_photos.py
"""
import json
import subprocess
import time
import urllib.request
from pathlib import Path

import fetch_player_photos as f

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "stadium"

# key -> (Commons file, what it shows)
PHOTOS = {
    "old-trafford-night": ("Old Trafford, view from Stretford End 1.jpg", "Old Trafford on a match night, seen from the Stretford End"),
    "stretford-end": ("Stretford End, Old Trafford.jpg", "The Stretford End (West Stand)"),
    "ferguson-stand": ("Sir Alex Ferguson stand, Old Trafford.jpg", "The Sir Alex Ferguson Stand (North Stand)"),
    "munich-clock": ("Munich clock.JPG", "The Munich Clock, stopped at the time of the 1958 air disaster (photographed in 2008)"),
    "munich-tunnel": ("Munich Tunnel 2.jpg", "The Munich Tunnel, in the Sir Bobby Charlton (South) Stand"),
    "united-trinity": ("The United Trinity statue outside Manchester United football ground - geograph.org.uk - 8107597.jpg", "The United Trinity statue (Best, Law and Charlton) outside Old Trafford"),
    "carrington": ("MUFC training ground Carrington.jpg", "The Carrington training ground from the air in October 2009"),
    "the-cliff": ("The Cliff.jpg", "The administrative building at The Cliff, the club’s old training ground, in 2009"),
    "maine-road": ("Main Stand, Maine Road, 1985.jpg", "The main stand at Maine Road in 1985, Manchester City’s ground, where United played from 1941 to 1949"),
    "north-road": ("North Road.jpg", "A black-and-white photograph of North Road, the club’s first ground (Commons dates it 1909, though United left North Road in 1893)"),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    credits = {}
    for key, (name, shows) in PHOTOS.items():
        info = f.commons_info(name)
        if not info:  # a long geograph file name may have changed: find it by search
            d = f.api("commons.wikimedia.org", action="query", list="search", srsearch=name.split(" - ")[0], srnamespace=6, srlimit=3)
            hit = next((h["title"][5:] for h in d["query"]["search"] if "United Trinity" in h["title"]), None)
            info = f.commons_info(hit) if hit else None
        assert info and f.OK_LICENCE.match(info["licence"] or ""), (key, info and info["licence"])
        path = OUT / f"{key}.jpg"
        time.sleep(1.5)
        path.write_bytes(urllib.request.urlopen(urllib.request.Request(info["thumb"], headers=f.UA), timeout=60).read())
        dims = subprocess.run(["sips", "-g", "pixelHeight", "-g", "pixelWidth", str(path)], capture_output=True, text=True).stdout.split()
        if max(int(dims[-1]), int(dims[-3])) > 960:
            subprocess.run(["sips", "-Z", "960", "-s", "format", "jpeg", "-s", "formatOptions", "82", str(path), "--out", str(path)], capture_output=True)
        credits[key] = {"shows": shows, **{k: info[k] for k in ("title", "author", "licence", "licence_url", "page")}}
        print(f"{key:<20} {info['licence']:<13} {info['author'][:28]}")
    (ROOT / "src" / "lib" / "stadium-photos.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
