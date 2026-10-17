#!/usr/bin/env python3
"""Downloads the free-licensed manager photos -> public/managers/ and src/lib/manager-photos.json.

Each file is on Wikimedia Commons under CC BY, CC BY-SA, CC0 or the public domain and was picked by name and checked
by eye. Photos under 300px wide, and managers with no free photo (mostly the early secretaries), are left out.
Busby and Murphy are pictured by their statues, and the caption says so. The credit for each is saved with it.

    python3 scripts/fetch_manager_photos.py
"""
import json
import subprocess
import time
import urllib.request
from pathlib import Path

import fetch_player_photos as f

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "managers"

# name -> (Commons file, what it shows)
PHOTOS = {
    "Ernest Mangnall": ("Ernest Mangnall.jpg", "Ernest Mangnall"),
    "Scott Duncan": ("Scott Duncan of Newcastle United 1908.jpg", "Scott Duncan as a Newcastle United player in 1908"),
    "Matt Busby": ("Matt Busby statue Old Trafford.jpg", "The statue of Sir Matt Busby outside Old Trafford"),
    "Jimmy Murphy": ("Jimmy Murphy statue.JPG", "A bronze bust of Jimmy Murphy"),
    "Wilf McGuinness": ("Wilf mcguinness 2013.jpg", "Wilf McGuinness in 2013"),
    "Tommy Docherty": ("Tommy Docherty 2017 02.jpg", "Tommy Docherty in 2017"),
    "Ron Atkinson": ("Atkinson,_Ron.jpg", "Ron Atkinson"),
    "Alex Ferguson": ("Alex Ferguson 02.jpg", "Sir Alex Ferguson"),
    "David Moyes": ("David_Moyes.jpg", "David Moyes, in an Everton jacket"),
    "Ryan Giggs": ("Cskamu 17.jpg", "Ryan Giggs"),
    "Louis van Gaal": ("Louis-van-gaal2.jpg", "Louis van Gaal"),
    "José Mourinho": ("José Mourinho.jpg", "José Mourinho"),
    "Ole Gunnar Solskjær": ("Ole_Gunnar_Solskjaer_Trondheim2011-1_crop.jpg", "Ole Gunnar Solskjær in 2011, while manager of Molde"),
    "Michael Carrick": ("Michael Carrick cropped (cropped smaller).jpg", "Michael Carrick as a United player"),
    "Ralf Rangnick": ("2022-07-30 Fußball, Männer, DFL-Supercup, RB Leipzig - FC Bayern München 1DX 3148 by Stepro.jpg", "Ralf Rangnick"),
    "Erik ten Hag": ("Erik ten Hag 2017 (cropped2).jpg", "Erik ten Hag in 2017"),
    "Ruud van Nistelrooy": ("Ruud-van-Nistelrooy3.jpg", "Ruud van Nistelrooy"),
    "Ruben Amorim": ("RubenAmorim4.png", "Ruben Amorim"),
    "Darren Fletcher": ("Darren Fletcher vs Everton (cropped).jpg", "Darren Fletcher as a United player"),
}


def slug(name):
    import unicodedata

    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return "".join(c if c.isalnum() else "-" for c in s).strip("-").replace("--", "-")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    credits = {}
    for name, (fn, shows) in PHOTOS.items():
        info = f.commons_info(fn)
        assert info and f.OK_LICENCE.match(info["licence"] or ""), (name, info and info["licence"])
        if (info["width"] or 0) < 300:
            print("too small, skipped:", name, info["width"])
            continue
        path = OUT / f"{slug(name)}.jpg"
        time.sleep(1.5)
        path.write_bytes(urllib.request.urlopen(urllib.request.Request(info["thumb"], headers=f.UA), timeout=60).read())
        # the Amorim file is a PNG: convert; shrink anything over 640px on the long side (never enlarge)
        kind = subprocess.run(["file", "-b", str(path)], capture_output=True, text=True).stdout
        dims = subprocess.run(["sips", "-g", "pixelHeight", "-g", "pixelWidth", str(path)], capture_output=True, text=True).stdout.split()
        big = max(int(dims[-1]), int(dims[-3])) > 640
        if big:
            subprocess.run(["sips", "-Z", "640", "-s", "format", "jpeg", "-s", "formatOptions", "82", str(path), "--out", str(path)], capture_output=True)
        elif "PNG" in kind:
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "85", str(path), "--out", str(path)], capture_output=True)
        credits[slug(name)] = {"name": name, "shows": shows, **{k: info[k] for k in ("title", "author", "licence", "licence_url", "page")}}
        print(f"{name:<24} {info['licence']:<13} {info['author'][:30]}")
    (ROOT / "src" / "lib" / "manager-photos.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
