/**
 * The goals on the Overhead Kicks page. Everything here was checked against the sources listed with it
 * (match data from ESPN; reports from Al Jazeera, premierleague.com, manutd.com). If a fact could not be
 * confirmed it says so. To add a goal, add one entry and tune its `model` numbers (see src/components/kick3d/).
 *
 * Pitch measurements used by the 3D model are in metres. 1 yard = 0.9144 m.
 */

export type KickSource = { label: string; url: string };

export type Kick = {
  id: string;
  player: string;
  shortTitle: string;
  title: string;
  date: string; // e.g. "12 February 2011"
  competition: string;
  venue: string;
  fixture: string; // "Manchester United 2–1 Manchester City"
  minute: string;
  /** How far from the goal line the ball was struck. `estimate` says whether it is our own estimate. */
  distance: { yards: number; metres: number; estimate: boolean; note: string };
  summary: string[]; // match summary, one paragraph per item
  facts: string[]; // short bullet facts about the goal itself
  scorers: string; // all the goals in the match
  sources: KickSource[];
  /** Numbers for the 3D reconstruction: where the ball was struck (x sideways, z from the goal line) and where it ended up. */
  model: { contactX: number; contactZ: number; crossFrom: [number, number, number]; target: [number, number, number] };
};

export const KICKS: Kick[] = [
  {
    id: "rooney-2011",
    player: "Wayne Rooney",
    shortTitle: "Rooney v Manchester City",
    title: "Wayne Rooney v Manchester City",
    date: "12 February 2011",
    competition: "Premier League",
    venue: "Old Trafford",
    fixture: "Manchester United 2–1 Manchester City",
    minute: "78th minute",
    distance: {
      yards: 12,
      metres: 11,
      estimate: true,
      note: "No measured distance has been published that we could find. This is our estimate: Al Jazeera’s match report has Rooney leaping from the penalty spot (12 yards from goal), while other accounts put him nearer the edge of the area, so the real figure is probably between about 10 and 18 yards.",
    },
    summary: [
      "The Manchester derby at Old Trafford was level at 1–1. Nani had given United the lead in the 41st minute and David Silva had equalised for City in the 65th.",
      "In the 78th minute a high cross from Nani, deflected on its way, dropped behind Rooney, who was facing away from goal near the penalty spot. He leapt, turned in the air and struck an overhead kick into the top corner past Joe Hart.",
      "It won the game 2–1 and kept United top of the table in the season they went on to win the league title. Sir Alex Ferguson reportedly called it the best goal he had ever seen at Old Trafford.",
    ],
    facts: [
      "Assist: Nani, from a deflected cross.",
      "Joe Hart has said he thinks the ball came off Rooney’s shin; Rooney insists it was a clean strike.",
      "Voted the best goal of the Premier League’s first 20 seasons at the league’s 20 Seasons Awards.",
    ],
    scorers: "Nani 41', David Silva 65' (City), Rooney 78'",
    sources: [
      { label: "Al Jazeera match report", url: "https://www.aljazeera.com/sports/2011/2/12/brilliant-rooney-downs-city" },
      { label: "Premier League: memorable Manchester derby moments", url: "https://www.premierleague.com/news/4193513" },
      { label: "Manchester United: five Reds look back on the goal", url: "https://www.manutd.com/en/news/detail/five-reds-look-back-on-wayne-rooney-overhead-kick-v-man-city" },
      { label: "Premier League: 2010/11 season review (the goal voted best in the 20 Seasons Awards)", url: "https://www.premierleague.com/en/news/693661" },
      { label: "Scorers and minutes: ESPN match data (event 292922)", url: "https://www.espn.com/soccer/match/_/gameId/292922" },
    ],
    model: { contactX: 1.0, contactZ: 11.0, crossFrom: [30, 2.0, 24], target: [2.6, 2.1, 0] },
  },
];
