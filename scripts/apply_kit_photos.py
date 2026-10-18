#!/usr/bin/env python3
"""Replaces squad photos with free-licensed ones showing the player in a Manchester United shirt, where one exists.

Found with scripts/find_kit_photos.py and chosen by eye. Most are from one photographer's home-match pictures
(2021-22) and, for Fernandes, a frame from AFC Bournemouth's own video of the 4-4 at Old Trafford in December 2025
(CC BY 3.0). Commons has almost no free United match photos after 2022, so many players still have a picture from
another club or their country; those are left as they were. Updates public/players/<slug>.jpg and the credit
(with a note of what the photo shows) in src/lib/player-photos.json.

    python3 scripts/apply_kit_photos.py
"""
import json
import subprocess
import time
import urllib.request
from pathlib import Path

import fetch_player_photos as f

ROOT = Path(__file__).resolve().parent.parent
CREDITS = ROOT / "src" / "lib" / "player-photos.json"

# slug -> (Commons file, what the picture shows)
PICKS = {
    "tom-heaton": ("Tom Heaton 2021.jpg", "In United kit against BSC Young Boys, 8 December 2021"),
    "harry-maguire": ("Harry Maguire Manchester United 16 April 2022.jpg", "In United kit against Norwich City, 16 April 2022"),
    "lisandro-martinez": ("Lisandro Martinez 2022.jpg", "In United kit against Arsenal, 4 September 2022"),
    "diogo-dalot": ("Diogo Dalot 2022 (cropped).jpg", "In United kit against Norwich City, 16 April 2022"),
    "bruno-fernandes": ("Bruno Fernandes 00-07-14.16.png", "In United kit against Bournemouth, 15 December 2025 (a frame from AFC Bournemouth’s video)"),
    "amad-diallo": ("Manchester United v BSC Young Boys, 8 December 2021 (15).jpg", "In United kit against BSC Young Boys, 8 December 2021"),
}
# photos already in United kit that stay as they are: note what they show
KEEP_NOTES = {
    "luke-shaw": "In United kit against Newcastle United, 11 September 2021",
    "bryan-mbeumo": "In United kit against Bournemouth, 15 December 2025 (a frame from AFC Bournemouth’s video)",
}


def main():
    credits = json.loads(CREDITS.read_text())
    for slug, (fn, shows) in PICKS.items():
        info = f.commons_info(fn)
        assert info and f.OK_LICENCE.match(info["licence"] or ""), (slug, info and info["licence"])
        path = ROOT / "public" / "players" / f"{slug}.jpg"
        time.sleep(1.5)
        path.write_bytes(urllib.request.urlopen(urllib.request.Request(info["thumb"], headers=f.UA), timeout=60).read())
        kind = subprocess.run(["file", "-b", str(path)], capture_output=True, text=True).stdout
        dims = subprocess.run(["sips", "-g", "pixelHeight", "-g", "pixelWidth", str(path)], capture_output=True, text=True).stdout.split()
        big = max(int(dims[-1]), int(dims[-3])) > 700
        if big or "PNG" in kind:  # shrink big ones; convert the PNG frame to JPEG; never enlarge
            args = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "84"] + (["-Z", "700"] if big else [])
            subprocess.run(args + [str(path), "--out", str(path)], capture_output=True)
        credits[slug] = {"shows": shows, **{k: info[k] for k in ("title", "author", "licence", "licence_url", "page")}}
        print(f"{slug:<20} {info['licence']:<13} {info['author'][:30]}")
    for slug, shows in KEEP_NOTES.items():
        credits[slug]["shows"] = shows
    CREDITS.write_text(json.dumps(credits, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
