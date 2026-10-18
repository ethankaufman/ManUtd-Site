#!/usr/bin/env python3
"""Downloads the free-licensed legend portraits -> public/legends/ and src/lib/legend-photos.json.

Found with scripts/find_legend_photos.py and chosen by eye (CC BY, CC BY-SA, CC0 or public domain on Wikimedia
Commons). Wherever a good free photo in a United shirt exists it is used; for the older legends there is none
(the only free pictures are statues and later portraits), and each caption says exactly what the picture shows.

    python3 scripts/apply_legend_photos.py
"""
import json
import subprocess
import time
import urllib.request
from pathlib import Path

import fetch_player_photos as f

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "legends"

# slug -> (Commons file, what the picture shows, credit override if Commons' author field is messy)
PICKS = {
    "duncan-edwards": ("DuncanEdwards1.jpg", "The statue of Duncan Edwards in Dudley", None),
    "bobby-charlton": ("LondonHouseAmsterdam1966 Bobby Charlton.jpg", "Bobby Charlton in Amsterdam, October 1966", None),
    "denis-law": ("Denis Law (4x5 cropped).jpg", "Denis Law in 2011", None),
    "george-best": ("George best 1976.jpg", "George Best in 1976", None),
    "nobby-stiles": ("Nobby Stiles (1966).jpg", "Nobby Stiles on a 1966–67 Panini collector card", None),
    "bryan-robson": ("Bryan Robson Thailand 2009-11-01 (2).jpg", "Bryan Robson in 2009", None),
    "mark-hughes": ("Mark Hughes 2015.jpg", "Mark Hughes in 2015, as Stoke City manager", None),
    "peter-schmeichel": ("Peter Schmeichel 2012-01-25 001.jpg", "Peter Schmeichel in 2012", None),
    "eric-cantona": ("Eric Cantona Cannes 2009.jpg", "Éric Cantona at the Cannes film festival in 2009", None),
    "roy-keane": ("Roy keane 2014.jpg", "Roy Keane in 2014", None),
    "gary-neville": ("Gary Neville crop.jpg", "Gary Neville playing for United in 2006", None),
    "paul-scholes": ("P Scholes.jpg", "Paul Scholes in 2008", None),
    "ryan-giggs": ("Ryan Giggs in 2008.jpg", "Ryan Giggs in 2008", None),
    "david-beckham": ("1999 FA Cup Final Beckham corner.jpg", "David Beckham taking a corner for United in the 1999 FA Cup final", "Michael Cairns"),
    "ole-gunnar-solskjaer": ("Ole Gunnar Solksjaer 2021.jpg", "Ole Gunnar Solskjær in October 2021, as United manager", None),
    "cristiano-ronaldo": ("Cristiano Ronaldo vs Everton 2021.jpg", "Cristiano Ronaldo against Everton, 2 October 2021", None),
    "wayne-rooney": ("Rooney CL.jpg", "Wayne Rooney in April 2009", None),
    "rio-ferdinand": ("Rio Ferdinand 2008.jpg", "Rio Ferdinand in 2008", None),
    "nemanja-vidic": ("Nemanja Vidić.jpg", "Nemanja Vidić playing for United in 2006", None),
    "edwin-van-der-sar": ("Edwin van derSar playing for MUFC cropped.jpg", "Edwin van der Sar playing for United in 2006", None),
}


# a tight 3:4 crop (left, top, width as fractions of the big original) where the legend is small in the frame
CROPS = {"david-beckham": (0.345, 0.30, 0.20)}


def big_crop(fn, path, crop):
    """Download the original at 3000px and cut the 3:4 box round the player."""
    from PIL import Image

    d = f.api("commons.wikimedia.org", action="query", titles="File:" + fn, prop="imageinfo", iiprop="url", iiurlwidth=3000)
    url = d["query"]["pages"][0]["imageinfo"][0]["thumburl"]
    time.sleep(1.5)
    path.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=f.UA), timeout=90).read())
    im = Image.open(path).convert("RGB")
    w, h = im.size
    x0, y0, cw = int(crop[0] * w), int(crop[1] * h), int(crop[2] * w)
    im.crop((x0, y0, x0 + cw, y0 + int(cw * 4 / 3))).save(path, quality=88)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    credits = {}
    for slug, (fn, shows, author) in PICKS.items():
        info = f.commons_info(fn)
        assert info and f.OK_LICENCE.match(info["licence"] or ""), (slug, info and info["licence"])
        path = OUT / f"{slug}.jpg"
        time.sleep(1.5)
        if slug in CROPS:
            big_crop(fn, path, CROPS[slug])
        else:
            path.write_bytes(urllib.request.urlopen(urllib.request.Request(info["thumb"], headers=f.UA), timeout=60).read())
        kind = subprocess.run(["file", "-b", str(path)], capture_output=True, text=True).stdout
        dims = subprocess.run(["sips", "-g", "pixelHeight", "-g", "pixelWidth", str(path)], capture_output=True, text=True).stdout.split()
        big = max(int(dims[-1]), int(dims[-3])) > 800
        if big or "PNG" in kind:  # shrink big ones; never enlarge
            args = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "84"] + (["-Z", "800"] if big else [])
            subprocess.run(args + [str(path), "--out", str(path)], capture_output=True)
        credits[slug] = {"shows": shows, **{k: info[k] for k in ("title", "licence", "licence_url", "page")}, "author": author or info["author"]}
        print(f"{slug:<22} {info['licence']:<13} {(author or info['author'])[:30]}")
    (ROOT / "src" / "lib" / "legend-photos.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
