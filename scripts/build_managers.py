#!/usr/bin/env python3
"""Builds data/club/managers.json from data/club/managers_raw.json (Wikipedia) and our own data.

Checks (the script stops with an error if one fails):
  * every tenure from 2013 on is recomputed from our match data (all competitive matches, no friendlies, the same
    rule Wikipedia states) and must equal Wikipedia's matches/wins/draws/losses; goals are reported if they differ
    and OUR figure is used (Solskjaer and Carrick's 2026 spell differ from Wikipedia's goal totals; our totals agree
    with the official Premier League data and with two sources for the cup matches),
  * every trophy in data/club/honours.json is assigned to the manager in charge on that date, and each manager's
    counts must equal the honours listed for him on Wikipedia.

The short "story" for each manager is written only from sentences in Wikipedia's managerial history (and the table's
notes); managers Wikipedia says nothing about get no story.

    python3 scripts/build_managers.py
"""
import glob
import json
import re
from pathlib import Path

from fetch_manager_photos import slug

ROOT = Path(__file__).resolve().parent.parent
CLUB = ROOT / "data" / "club"
U = "Manchester United"
AS_OF = "2026-05-24"  # "Information correct as of 24 May 2026" on Wikipedia's page

SECRETARIES = {"A. H. Albut", "James West", "Ernest Mangnall", "John Bentley"}  # "four secretaries" (Wikipedia)
COUNTRY = {"ENG": "England", "SCO": "Scotland", "WAL": "Wales", "IRL": "Republic of Ireland", "NED": "Netherlands", "POR": "Portugal", "NOR": "Norway", "GER": "Germany"}

STORY = {
    "A. H. Albut": "Secretary of the committee that chose the team. Wikipedia notes that his exact date of appointment is unknown.",
    "James West": "A secretary of the committee that chose the team, from 1900 to 1903.",
    "Ernest Mangnall": "The first man to bring major silverware to the club: the first Football League title in 1908, the inaugural Charity Shield, the first FA Cup the following season, then another league title and Charity Shield in 1911. He left in 1912 to join Manchester City, and his last match in charge of United was the Old Trafford derby of 7 September 1912.",
    "T. J. Wallworth": "Only the club’s acting secretary, so he is not included in any official list of the club’s managers.",
    "John Bentley": "Took over as club secretary after Mangnall, and was replaced two years later by Jack Robson.",
    "Jack Robson": "The club’s first full-time manager. He stayed seven years and resigned in December 1921 after a bout of pneumonia.",
    "John Chapman": "United were relegated to the Second Division in his first season, and promoted back after three years there. After a 9th place finish and an FA Cup semi-final in 1925–26, he received a telegram from the Football Association on 8 October 1926 suspending him from management for the rest of the season. No reason was given.",
    "Lal Hilditch": "A half-back who took over as player-manager for the rest of the 1926–27 season, before Herbert Bamlett took permanent control.",
    "Herbert Bamlett": "Manager for four years without success: the club’s highest position during his time was 12th. United were relegated to the Second Division in 1931 and he was replaced.",
    "Walter Crickmer": "The club secretary, who kept that job while he managed. His first spell lasted a season, because he failed to return the club to the First Division. He took over again after the 1937 relegation and ran the team until the end of the Second World War.",
    "Scott Duncan": "Appointed in June 1932. In his second season United finished 20th in the Second Division, which remains the club’s lowest league position. The club kept faith in him and he got them back into the First Division by 1936, but they were relegated again the following year.",
    "Matt Busby": "The club approached him before the war ended, after he had turned down a job on Liverpool’s coaching staff because he wanted more responsibility for the playing side than merely selecting the team. After the Munich air disaster he rebuilt his side and won the FA Cup in 1963, two league titles in three years, and then the European Cup. He stayed one more year, handed the job to Wilf McGuinness, and returned for the second half of 1970–71 when McGuinness struggled.",
    "Jimmy Murphy": "Busby’s assistant. While Busby was in hospital recovering from the injuries he suffered in the Munich air disaster, Murphy took over his managerial duties.",
    "Wilf McGuinness": "Took over from Busby in 1969 but struggled in the job, and Busby was convinced to return for the second half of 1970–71. McGuinness did not win a trophy for United.",
    "Frank O’Farrell": "Did not win a trophy for United.",
    "Dave Sexton": "Moved from Queens Park Rangers and stayed four years, until he was replaced in 1981 by Ron Atkinson.",
    "Ron Atkinson": "Rekindled the club’s cup success, winning two FA Cups in five years, and oversaw a series of respectable league finishes. After a disastrous start to 1986–87 he was sacked.",
    "Alex Ferguson": "Joined from Aberdeen on 6 November 1986, the day Ron Atkinson was sacked. Reportedly close to the sack himself, his first trophy at the club was the 1990 FA Cup, then the Cup Winners’ Cup in 1991 and the club’s first League Cup in 1992. In 1993 he won United’s first league title in 26 years, and in 1999 the Treble. His 13th and final league title in 2012–13 made it 20 for the club. He retired as the most decorated manager in football history.",
    "David Moyes": "Replaced Ferguson from Everton. In his first match he won the Community Shield, his only trophy. After failing to qualify for the Champions League he was sacked before the end of his first season, with Ryan Giggs taking temporary charge.",
    "Ryan Giggs": "Took temporary charge for the final four games of 2013–14, as a player-manager.",
    "Louis van Gaal": "Appointed on 19 May 2014. In his first season United finished fourth and returned to the Champions League; in his second they finished fifth but won the 2015–16 FA Cup, the club’s first in a dozen years. He was sacked on 23 May 2016, two days after lifting the cup.",
    "José Mourinho": "Replaced Van Gaal four days after his sacking. In his first season he won the Community Shield, the League Cup and the Europa League, the club’s first, which made United the fifth team to win all of the main European club competitions. He won nothing in 2017–18, finishing second in the league and in the FA Cup, and was sacked on 18 December 2018 after seven wins in the first 17 league games of 2018–19.",
    "Ole Gunnar Solskjær": "A former United forward, appointed caretaker for the rest of 2018–19. He won his first seven games in charge, a club record, and was given the job permanently on 28 March 2019 after beating Paris Saint-Germain. He left on 21 November 2021 without winning a trophy for United.",
    "Michael Carrick": "First-team coach Carrick took charge as caretaker after Solskjær’s departure until 2 December 2021. He returned as interim head coach in January 2026 after Ruben Amorim’s dismissal, and was hired permanently on 22 May 2026.",
    "Ralf Rangnick": "Appointed interim manager until the end of 2021–22.",
    "Erik ten Hag": "Announced as full-time manager on 21 April 2022. He won the EFL Cup on 26 February 2023, the club’s first trophy in nearly six years, then beat Manchester City 2–1 in the 2024 FA Cup final. He was sacked in October 2024 after three league wins in the first nine games left United 14th.",
    "Ruud van Nistelrooy": "A former United striker and one of Ten Hag’s assistants, he took interim charge for four matches before Ruben Amorim’s appointment.",
    "Ruben Amorim": "Appointed head coach on 11 November 2024. He lasted less than 14 months, until January 2026.",
    "Darren Fletcher": "Interim head coach for two matches in January 2026, after Ruben Amorim’s dismissal.",
}

# the words Wikipedia uses for each honour -> our trophy key
CATEGORY = [
    ("Cup Winners", "cup-winners-cup"), ("Europa League", "europa-league"), ("Champions League", "european-cup"), ("European Cup", "european-cup"),
    ("Super Cup", "super-cup"), ("Intercontinental", "intercontinental-cup"), ("Club World Cup", "club-world-cup"),
    ("Second Division", "second-division"), ("First Division", "league"), ("Premier League", "league"),
    ("League Cup", "league-cup"), ("FA Cup", "fa-cup"), ("Shield", "community-shield"),
]


def pad(d, end):
    """Make a partial date comparable: '1958-02' -> first or last day of the month; '1889' -> first or last of the year."""
    if d == "present":
        return "9999-12-31"
    if len(d) == 4:
        return d + ("-12-31" if end else "-01-01")
    if len(d) == 7:
        return d + ("-31" if end else "-01")
    return d


def wiki_honours(strings):
    out = {}
    for s in strings:
        m = re.match(r"(\d+)\s+(.*?)(?:\s*\(inc\.\s*(\d+)\s*shared\)|\s*\((shared)\))?$", s)  # "(inc. 2 shared)" or "(shared)"
        key = next((k for w, k in CATEGORY if w in m.group(2)), None)
        assert key, s
        shared = int(m.group(3)) if m.group(3) else int(m.group(1)) if m.group(4) else 0
        out[key] = (out.get(key, (0, 0))[0] + int(m.group(1)), out.get(key, (0, 0))[1] + shared)
    return out


def load_matches():
    ms = []
    for f in glob.glob(str(ROOT / "data" / "season" / "*.json")):
        d = json.loads(Path(f).read_text())
        kinds = {c["slug"]: c["kind"] for c in d["competitions"]}
        ms += [m for m in d["matches"] if m["state"] == "finished" and kinds.get(m["comp"]) != "friendly"]
    return ms


def our_record(ms, a, b):
    n = w = dr = l = gf = ga = 0
    for m in ms:
        if a <= m["kick"][:10] <= b:
            home = m["home"] == U
            f, g = (m["hg"], m["ag"]) if home else (m["ag"], m["hg"])
            n += 1
            gf += f
            ga += g
            w += f > g
            dr += f == g
            l += f < g
    return {"m": n, "w": w, "d": dr, "l": l, "gf": gf, "ga": ga}


def main():
    raw = json.loads((CLUB / "managers_raw.json").read_text())
    honours = json.loads((CLUB / "honours.json").read_text())
    ms = load_matches()
    audit = []

    # 1. records for the tenures our match data covers completely
    stints = []
    for x in raw:
        a, b = pad(x["from"], False), pad(x["to"], True)
        st = {"from": x["from"], "to": x["to"], "m": x["m"], "w": x["w"], "d": x["d"], "l": x["l"], "gf": x["gf"], "ga": x["ga"], "source": "wikipedia", "role": x["role"], "notes": x["notes"], "wikipedia_honours": x["honours"], "name": x["name"], "image": x["image"], "player_manager": x["player_manager"], "country": x["country"]}
        if a >= "2013-07-01":
            ours = our_record(ms, a, min(b, AS_OF))
            assert (ours["m"], ours["w"], ours["d"], ours["l"]) == (x["m"], x["w"], x["d"], x["l"]), (x["name"], ours, x)
            if (ours["gf"], ours["ga"]) != (x["gf"], x["ga"]):
                audit.append(f"{x['name']} {x['from']}..{x['to']}: goals ours {ours['gf']}-{ours['ga']} vs Wikipedia {x['gf']}-{x['ga']} (results identical); ours used")
            st.update(ours)
            st["source"] = "match data (equals Wikipedia on matches, wins, draws, losses)"
        stints.append(st)

    # 2. honours assigned by date, compared with Wikipedia's honours for each person
    def trophy_dates():
        for t in honours["trophies"]:
            key = {"premier-league": "league", "first-division": "league"}.get(t["key"], t["key"])
            for e in t["entries"]:
                date = e["final"]["date"] if e["final"] else f"{e['year']}-05-01"
                yield key, t, e, date

    for st in stints:
        st["honours"] = []
    for key, t, e, date in trophy_dates():
        owner = [s for s in stints if pad(s["from"], False) <= date <= pad(s["to"], True)]
        assert owner, (t["name"], date)
        s = min(owner, key=lambda s: (s["role"] is not None, pad(s["from"], False)))  # prefer the full manager if two overlap
        s["honours"].append({"key": key, "trophy": t["name"], "label": e["label"], "shared": e["shared"], "date": date})

    people = {}
    for st in stints:
        people.setdefault(st["name"], []).append(st)

    problems = []
    for name, ss in people.items():
        ours = {}
        for s in ss:
            for h in s["honours"]:
                c = ours.get(h["key"], (0, 0))
                ours[h["key"]] = (c[0] + 1, c[1] + (1 if h["shared"] else 0))
        theirs = wiki_honours([h for s in ss for h in s["wikipedia_honours"]])
        # Wikipedia lumps "First Division" and "Premier League" together as "league"; shared Shields are counted in the total
        if ours != theirs:
            problems.append(f"{name}: ours {ours} vs Wikipedia {theirs}")
    assert not problems, "\n".join(problems)

    # 3. assemble people in order of first appearance
    out = []
    for name, ss in people.items():
        first = ss[0]
        role = "secretary-manager" if name in SECRETARIES else "acting secretary" if name == "T. J. Wallworth" else None
        kinds = {s["role"] for s in ss} - {None}
        full = any(st["role"] is None for st in ss)  # any spell as the appointed manager makes him a manager now (Carrick: caretaker in 2021, appointed in 2026)
        status = role or ("manager" if full else "caretaker" if kinds == {"caretaker"} else "interim" if kinds == {"interim"} else "manager")
        if name == "Lal Hilditch":
            status = "player-manager"
        if name == "Ryan Giggs":
            status = "caretaker"
        tot = {k: sum(s[k] or 0 for s in ss) for k in ("m", "w", "d", "l", "gf", "ga")}
        shown = name.replace("Frank O'Farrell", "Frank O’Farrell")
        out.append(
            {
                "name": shown,
                "slug": slug(name),
                "status": status,
                "country": COUNTRY.get(first["country"], first["country"]),
                "from": first["from"],
                "to": ss[-1]["to"],
                "current": any(s["to"] == "present" for s in ss),
                "stints": [{"from": s["from"], "to": s["to"], "role": s["role"], "m": s["m"], "w": s["w"], "d": s["d"], "l": s["l"], "gf": s["gf"], "ga": s["ga"], "note": (s["notes"] or [None])[0] if s["role"] or "interim until" in " ".join(s["notes"]) else None, "live": s["to"] == "present"} for s in ss],
                "totals": tot,
                "winPct": round(100 * tot["w"] / tot["m"], 1) if tot["m"] else None,
                "honours": [{"key": h["key"], "trophy": h["trophy"], "label": h["label"], "shared": h["shared"]} for s in ss for h in s["honours"]],
                "story": STORY.get(shown) or STORY.get(name),
            }
        )
    (CLUB / "managers.json").write_text(json.dumps({"asOf": AS_OF, "people": out}, ensure_ascii=False, indent=1) + "\n")
    (CLUB / "audit_managers.txt").write_text("\n".join(audit) + ("\n" if audit else ""))
    print(len(out), "people,", sum(len(p["stints"]) for p in out), "stints")
    print("audit:", *audit, sep="\n  ")
    for p in sorted(out, key=lambda p: -p["totals"]["m"])[:6]:
        print(f"  {p['name']:<22} {p['totals']['m']:>5} matches {p['winPct']}%  honours {len(p['honours'])}")


if __name__ == "__main__":
    main()
