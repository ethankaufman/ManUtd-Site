/**
 * The chapters of the site, in order. The home page, the top menu and every chapter page read from this
 * one list, so adding or renaming a chapter is a one-place change.
 *
 * status: "soon" = the page exists but is still a placeholder.
 */
export type Chapter = {
  slug: string;
  number: string;
  title: string;
  menu: string; // short name for the top menu
  teaser: string;
  planned: string[]; // what the finished page will have (shown on the placeholder page)
  status: "soon" | "live";
  featured?: boolean;
};

export const CHAPTERS: Chapter[] = [
  {
    slug: "season",
    number: "01",
    title: "This Season",
    menu: "This Season",
    teaser: "Every competition United play in this season: tables, results, fixtures, scorers.",
    planned: ["League table with form", "Every fixture and result", "Top scorers and assists", "Match-by-match scorers, assists and cards"],
    status: "live",
  },
  {
    slug: "squad",
    number: "02",
    title: "The Squad",
    menu: "Squad",
    teaser: "Everyone in the red shirt now, and a page for each player.",
    planned: ["The current squad by position", "A page per player with season and career stats", "Players from the past too"],
    status: "live",
  },
  {
    slug: "matches",
    number: "03",
    title: "Every Match",
    menu: "Matches",
    teaser: "Every United match since 1992–93 in every competition, season by season. Open any match for its goals, cards and line-ups.",
    planned: ["Search by opponent or player", "Head-to-head records against rivals"],
    status: "live",
  },
  {
    slug: "history",
    number: "04",
    title: "The History",
    menu: "History",
    teaser: "A timeline from 1878, every season on record, every final with its date and venue, every competition, and the captains.",
    planned: ["Shirt numbers through the years", "Kits through the years"],
    status: "live",
  },
  {
    slug: "honours",
    number: "05",
    title: "Honours & Awards",
    menu: "Honours",
    teaser: "The trophy cabinet, with a picture of each trophy, and the individual awards: all time, and since 1992.",
    planned: ["Individual awards from before 1992"],
    status: "live",
  },
  {
    slug: "managers",
    number: "06",
    title: "The Managers",
    menu: "Managers",
    teaser: "Every manager, caretaker and interim since 1889, with photos, their record and their trophies.",
    planned: ["A longer story for each manager"],
    status: "live",
  },
  {
    slug: "stadium",
    number: "07",
    title: "Old Trafford",
    menu: "Old Trafford",
    teaser: "The Theatre of Dreams, from the first match in 1910 to today, and the grounds before it.",
    planned: ["The history of Old Trafford", "The grounds United played in before it", "Capacity, rebuilds and records", "The stands, the tunnel and the famous nights"],
    status: "soon",
  },
  {
    slug: "overhead-kicks",
    number: "08",
    title: "Overhead Kicks",
    menu: "Overhead Kicks",
    teaser: "Wayne Rooney's famous derby winner against Manchester City, rebuilt in 3D, with the story of the match.",
    planned: [
      "An interactive 3D model of Wayne Rooney's overhead kick against Manchester City",
      "The story of the match and the goal",
    ],
    status: "live",
    featured: true,
  },
];

export const chapterBySlug = (slug: string) => CHAPTERS.find((c) => c.slug === slug)!;
