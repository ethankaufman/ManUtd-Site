/**
 * The goals on the Overhead Kicks page. Everything here was checked against the sources listed with it
 * (match data from ESPN; reports from AP, Al Jazeera, premierleague.com, manutd.com). If a fact could not be
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
      { label: "Premier League: Rooney, out of this world", url: "https://Premierleague.Com/pl30/rooney-out-of-this-world" },
      { label: "Scorers and minutes: ESPN match data (event 292922)", url: "https://www.espn.com/soccer/match/_/gameId/292922" },
    ],
    model: { contactX: 1.0, contactZ: 11.0, crossFrom: [30, 2.0, 24], target: [2.6, 2.1, 0] },
  },
  {
    id: "garnacho-2023",
    player: "Alejandro Garnacho",
    shortTitle: "Garnacho v Everton",
    title: "Alejandro Garnacho v Everton",
    date: "26 November 2023",
    competition: "Premier League",
    venue: "Goodison Park, Liverpool",
    fixture: "Everton 0–3 Manchester United",
    minute: "3rd minute",
    distance: {
      yards: 15,
      metres: 13.7,
      estimate: false,
      note: "15 yards (about 13.7 metres), as reported by the Associated Press. The Press Association reported it was slightly further out than Rooney’s.",
    },
    summary: [
      "United went to Goodison Park and took the lead after only three minutes. Diogo Dalot sent a cross into the box that seemed too deep for Garnacho, who had his back to goal.",
      "The 19-year-old adjusted, jumped and hit a bicycle kick that went into the top corner. It echoed Rooney’s goal against City twelve years earlier.",
      "Marcus Rashford added a penalty in the 56th minute and Anthony Martial scored in the 75th, set up by Bruno Fernandes, to make it 3–0.",
    ],
    facts: [
      "Assist: Diogo Dalot, with a cross.",
      "Won the 2024 FIFA Puskás Award for the most beautiful goal, presented at The Best FIFA Football Awards in Doha in December 2024.",
      "Voted Manchester United’s Goal of the Season for 2023–24.",
      "Garnacho was the second United player to win the Puskás Award, after Cristiano Ronaldo in 2009.",
    ],
    scorers: "Garnacho 3', Rashford 56' (pen), Martial 75'",
    sources: [
      { label: "Associated Press report (via KSAT)", url: "https://www.ksat.com/sports/2023/11/26/garnachos-sensational-overhead-kick-stuns-protesting-everton-fans-and-helps-man-united-earn-3-0-win/" },
      { label: "Premier League: Garnacho wins the Puskás Award", url: "https://www.premierleague.com/news/4199544" },
      { label: "Manchester United: Goal of the Season 2023–24", url: "https://www.manutd.com/en/news/detail/alejandro-garnacho-wins-man-utd-goal-of-the-season-award-2023-24" },
      { label: "Scorers and minutes: ESPN match data (event 671157)", url: "https://www.espn.com/soccer/match/_/gameId/671157" },
    ],
    model: { contactX: 1.0, contactZ: 13.7, crossFrom: [32, 1.5, 30], target: [2.6, 2.1, 0] },
  },
];
