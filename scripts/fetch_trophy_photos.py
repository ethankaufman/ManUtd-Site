#!/usr/bin/env python3
"""Downloads the free-licensed trophy photos used on the Honours page -> public/trophies/ and src/lib/trophy-photos.json.

Each file was picked by eye from Wikimedia Commons (CC BY, CC BY-SA or CC0 only) so that it really shows that trophy.
Trophies with no suitable free photo (the Second Division title and the FIFA Club World Cup) are simply left out.
The credits (author, licence, link) are saved and shown under each picture.

    python3 scripts/fetch_trophy_photos.py
"""
import json
import subprocess
import time
import urllib.request
from pathlib import Path

import fetch_player_photos as f

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "trophies"

# honours key -> (Commons file name, what the picture shows, for the caption)
PHOTOS = {
    "premier-league": ("Trophée Premier League 13-14.jpg", "The Premier League trophy"),
    "first-division": ("First Division (pre 1992) Trophy.png", "An illustration of the Football League championship trophy used before 1992"),
    "fa-cup": ("The FA Cup Trophy.jpg", "The FA Cup at Wembley"),
    "league-cup": ("EFL Cup trophy displyed in Liverpool FC museum.jpg", "The League Cup, shown in Liverpool’s museum"),
    "community-shield": ("FA Community Shield.JPG", "The Community Shield"),
    "european-cup": ("2006 Champions League Trophy.jpg", "The European Cup / Champions League trophy (shown with another club’s ribbons)"),
    "cup-winners-cup": ("UEFA Cup Winners' Cup trophy at Manchester National Football Museum (Ank Kumar) 01.jpg", "The Cup Winners’ Cup, at the National Football Museum in Manchester"),
    "europa-league": ("Europa league trophy.jpg", "The Europa League trophy, in Liverpool’s museum"),
    "super-cup": ("UEFA Super Cup Trophy (6896943435).jpg", "The UEFA Super Cup"),
    "intercontinental-cup": ("Taça Intercontinental 1981 Flamengo.jpg", "The Intercontinental (Toyota) Cup, as shown in Flamengo’s museum"),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    credits = {}
    for key, (name, shows) in PHOTOS.items():
        info = f.commons_info(name)
        assert info and f.OK_LICENCE.match(info["licence"] or ""), (key, info and info["licence"])
        ext = ".png" if name.lower().endswith(".png") else ".jpg"
        path = OUT / f"{key}{ext}"
        time.sleep(1.5)
        path.write_bytes(urllib.request.urlopen(urllib.request.Request(info["thumb"], headers=f.UA), timeout=60).read())
        if ext == ".jpg":  # keep the long side to 720px (never enlarges a smaller photo)
            h = int(subprocess.run(["sips", "-g", "pixelHeight", str(path)], capture_output=True, text=True).stdout.split()[-1])
            w = int(subprocess.run(["sips", "-g", "pixelWidth", str(path)], capture_output=True, text=True).stdout.split()[-1])
            if max(h, w) > 720:
                subprocess.run(["sips", "-Z", "720", "-s", "format", "jpeg", "-s", "formatOptions", "82", str(path), "--out", str(path)], capture_output=True)
        credits[key] = {"file": path.name, "shows": shows, **{k: info[k] for k in ("title", "author", "licence", "licence_url", "page")}}
        print(f"{key:<22} {info['licence']:<12} {info['author'][:30]}")
    (ROOT / "src" / "lib" / "trophy-photos.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
