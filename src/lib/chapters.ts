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
    teaser: "Line-ups, scorers, assists and cards for the games, back to 1992 and beyond.",
    planned: ["A page for every match", "Starting XIs and substitutions", "Goals, assists and cards with minutes", "Search by opponent, season or competition"],
    status: "soon",
  },
  {
    slug: "history",
    number: "04",
    title: "The History",
    menu: "History",
    teaser: "Every competition United has played in, and every final, with the date and the place.",
    planned: ["Every competition in the club's history", "Every final: date, venue, score", "Season-by-season record from 1878", "Captains, shirt numbers and kits through the years"],
    status: "soon",
  },
  {
    slug: "honours",
    number: "05",
    title: "Honours & Awards",
    menu: "Honours",
    teaser: "The trophy cabinet and the individual awards: all time, and since 1992.",
    planned: ["All-time honours and awards", "A separate list for the Premier League era (since 1992)", "Each trophy with its years and finals"],
    status: "soon",
  },
  {
    slug: "managers",
    number: "06",
    title: "The Managers",
    menu: "Managers",
    teaser: "Every permanent and acting manager, with their record and their story.",
    planned: ["Every permanent manager", "Every acting and caretaker manager", "Matches, wins, trophies and win rate for each"],
    status: "soon",
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
