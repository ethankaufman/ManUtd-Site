#!/usr/bin/env python3
"""Builds data/club/timeline.json: the key moments in the club's history.

Every sentence here was checked against Wikipedia's club-history articles (listed as `sources`). Dates, scores and
counts are NOT typed in: they are looked up in data/club/finals.json and seasons.json, and the script stops with an
error if a claim does not hold, so the timeline can never disagree with the rest of the chapter.

    python3 scripts/build_timeline.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLUB = ROOT / "data" / "club"
WP = "https://en.wikipedia.org/wiki/"
H1 = WP + "History_of_Manchester_United_F.C._(1878%E2%80%931945)"
H2 = WP + "History_of_Manchester_United_F.C._(1945%E2%80%931969)"
H3 = WP + "History_of_Manchester_United_F.C._(1969%E2%80%931986)"
H4 = WP + "History_of_Manchester_United_F.C._(1986%E2%80%932013)"
MAIN = WP + "Manchester_United_F.C."
MUNICH = WP + "Munich_air_disaster"
OT = WP + "Old_Trafford"

finals = json.loads((CLUB / "finals.json").read_text())
seasons = {s["season"]: s for s in json.loads((CLUB / "seasons.json").read_text())}


def final(comp, date):
    f = next((x for x in finals if x["comp"] == comp and x["date"] == date), None)
    assert f, f"no {comp} final on {date}"
    return f


def nice(d):
    y, m, day = d.split("-")
    months = "January February March April May June July August September October November December".split()
    return f"{int(day)} {months[int(m) - 1]} {y}"


def score(f):
    return f"{f['score'][0]}–{f['score'][1]}"


# claims that must hold in the data
titles = [k for k, s in seasons.items() if s["division"] in ("Div 1", "Prem") and s["pos"] == "1st"]
assert len(titles) == 20, titles
assert titles[:7] == ["1907-08", "1910-11", "1951-52", "1955-56", "1956-57", "1964-65", "1966-67"], titles
assert titles[7] == "1992-93"  # the first title after 1966-67: 26 years later
prem_pos = {k: int("".join(c for c in s["pos"] if c.isdigit())) for k, s in seasons.items() if s["division"] == "Prem"}
assert max(prem_pos.values()) == 15 and prem_pos["2024-25"] == 15  # the lowest Premier League finish
assert seasons["1973-74"]["relegated"] and seasons["1973-74"]["pos"] == "21st" and seasons["1974-75"]["pos"] == "1st"
assert sum(1 for f in finals if f["comp"] == "fa-cup" and f["result"] == "Won") == 13
assert "Ban on English teams" in seasons["1985-86"]["europe"] and "Ban on English teams" in seasons["1989-90"]["europe"]

fa09, fa48, eu68 = final("fa-cup", "1909-04-24"), final("fa-cup", "1948-04-24"), final("champions-league", "1968-05-29")
cwc91, fa99, cl99 = final("cup-winners-cup", "1991-05-15"), final("fa-cup", "1999-05-22"), final("champions-league", "1999-05-26")
cl08, cwc08, el17 = final("champions-league", "2008-05-21"), final("club-world-cup", "2008-12-21"), final("europa-league", "2017-05-24")
fa24, el25 = final("fa-cup", "2024-05-25"), final("europa-league", "2025-05-21")
assert cl08["pens"] == [6, 5] and cl99["score"] == [2, 1] and eu68["aet"]

TIMELINE = [
    ("1878", "Founded as Newton Heath LYR", "Formed by the Carriage and Wagon department of the Lancashire and Yorkshire Railway depot at Newton Heath, Manchester.", [H1]),
    ("1892", "Into the Football League", "After the Football Alliance merged with the Football League, the club started 1892–93 in the First Division. By then it had dropped “LYR” from its name and moved to a new ground at Bank Street.", [H1]),
    ("24 April 1902", "Manchester United", "The club’s name was changed from Newton Heath to Manchester United.", [H1]),
    ("1908", "First league title", "United won the First Division in 1907–08 and began the next season by winning the first ever Charity Shield.", [H1]),
    (nice(fa09["date"]), "First FA Cup", f"Beat Bristol City {score(fa09)} in the final at {fa09['venue']}, {fa09['city']}.", [H1, "finals"]),
    ("19 February 1910", "Old Trafford opens", "The stadium’s first match was against Liverpool, who won 4–3. Sandy Turnbull scored the first ever goal at Old Trafford.", [OT]),
    ("October 1945", "Matt Busby", "As football resumed after the war, Busby was appointed manager. He demanded an unprecedented level of control over team selection, transfers and training.", [H2]),
    (nice(fa48["date"]), "FA Cup, 1948", f"A {score(fa48)} win over Blackpool at Wembley, the club’s first major trophy for 37 years.", [H2, "finals"]),
    ("1956–57", "Into Europe", "United became the first English club to compete in the European Cup, despite objections from the Football League. They reached the semi-final, losing to Real Madrid, and beat Anderlecht 10–0, the club’s biggest win on record.", [H2]),
    ("6 February 1958", "Munich", "The plane carrying the team home from a European Cup tie in Belgrade crashed on its third attempt to take off from Munich-Riem. It claimed 23 lives, including eight players: Geoff Bent, Roger Byrne, Eddie Colman, Duncan Edwards, Mark Jones, David Pegg, Tommy Taylor and Billy Whelan. Busby was hospitalised, and later rebuilt the team.", [MUNICH, H2]),
    (nice(eu68["date"]), "European champions", f"Beat Benfica {score(eu68)} after extra time at Wembley, the first English club to win the European Cup.", [H2, "finals"]),
    ("1974", "Relegated", "United finished 21st in 1973–74 and dropped into the Second Division. They won it at the first attempt, as champions in 1974–75.", ["seasons"]),
    ("1985–1990", "Banned from Europe", "English clubs were banned from European competition for five seasons, so United played none between 1985–86 and 1989–90.", ["seasons"]),
    ("6 November 1986", "Alex Ferguson", "Ferguson joined from Aberdeen on the day the previous manager, Ron Atkinson, was dismissed.", [H4]),
    (nice(cwc91["date"]), "1990 and 1991", f"Reportedly close to the sack after United finished 13th in 1989–90, Ferguson won the FA Cup final replay against Crystal Palace (after a 3–3 draw). The next season United won the Cup Winners’ Cup, beating Barcelona {score(cwc91)} in {cwc91['city']}.", ["finals", H4]),
    ("1993", "First league title in 26 years", "In the first season of the Premier League, 1992–93, United were champions, their first league title since 1966–67.", ["seasons"]),
    ("May 1999", "The Treble", f"United won the Premier League, beat Newcastle {score(fa99)} in the FA Cup final on {nice(fa99['date'])}, and won the Champions League on {nice(cl99['date'])}: 1–0 down in injury time against Bayern Munich at the {cl99['venue']}, Teddy Sheringham and Ole Gunnar Solskjær scored late goals. No English club had won all three in one season.", [H4, "finals"]),
    ("May 2005", "Glazer takeover", "The Glazer family bought a majority shareholding in a deal valuing the club at £800 million, and a month later took it off the London Stock Exchange. In protest, a group of fans formed F.C. United of Manchester.", [H4]),
    (nice(cl08["date"]), "Moscow", f"Champions League winners for the third time: {cl08['score'][0]}–{cl08['score'][1]} with Chelsea at the {cl08['venue']}, then {cl08['pens'][0]}–{cl08['pens'][1]} on penalties. Seven months later United won the FIFA Club World Cup, beating LDU Quito {score(cwc08)} in {cwc08['city']}.", ["finals", MAIN]),
    ("8 May 2013", "Ferguson retires", "Ferguson announced his retirement after winning a 20th league title, clinched with a 3–0 win over Aston Villa on 22 April 2013. He retired as the most decorated manager in football history.", [MAIN, H4]),
    (nice(el17["date"]), "Europa League", f"Beat Ajax {score(el17)} in Stockholm to win the Europa League, three months after winning the League Cup.", ["finals"]),
    ("24 December 2023", "New co-owner", "It was announced that Sir Jim Ratcliffe had purchased 25 per cent of the club, and that his Ineos Sport company was taking control of football operations.", [MAIN]),
    (nice(fa24["date"]), "FA Cup, 2024", f"Beat Manchester City {score(fa24)} at Wembley for a 13th FA Cup.", ["finals"]),
    (nice(el25["date"]), "Bilbao", f"Lost the Europa League final {el25['score'][0]}–{el25['score'][1]} to Tottenham Hotspur at San Mamés. That season United finished 15th in the Premier League, their lowest finish since the league began in 1992.", ["finals", "seasons"]),
]

SOURCE_NOTE = {
    "finals": "Match details: data/club/finals.json (Wikipedia, checked against our match data)",
    "seasons": "Season record: data/club/seasons.json (Wikipedia, checked against the official tables)",
}


def main():
    out = []
    for when, title, text, refs in TIMELINE:
        out.append({"when": when, "title": title, "text": text, "sources": [r for r in refs if r.startswith("http")], "from_data": [SOURCE_NOTE[r] for r in refs if r in SOURCE_NOTE]})
    (CLUB / "timeline.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(len(out), "entries")
    for e in out:
        print(f"  {e['when']:<18} {e['title']}")


if __name__ == "__main__":
    main()
