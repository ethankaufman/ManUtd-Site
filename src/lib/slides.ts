/**
 * The photos in the "Famous victories" slideshow on the home page.
 *
 * Every photo is from Wikimedia Commons under a free licence that REQUIRES the credit shown under it,
 * so keep `credit` accurate. Match facts were checked against Wikipedia (15 Oct 2026).
 * The pictures live in public/photos/. Add a slide by adding one entry here.
 */
export type Slide = {
  file: string; // file name inside public/photos/
  alt: string; // describes the picture for screen readers
  event: string; // small label above the headline: competition and venue
  date: string;
  headline: string; // the result, in big type
  detail?: string; // scorers etc.
  focus?: string; // CSS object-position, to choose which part of the photo is kept when it is cropped
  credit: { title: string; author: string; licence: string; url: string };
};

export const SLIDES: Slide[] = [
  {
    file: "facup99-celebration.jpg",
    alt: "Manchester United players celebrating on the Wembley pitch after the 1999 FA Cup final, with Newcastle players looking on.",
    event: "FA Cup final · Wembley Stadium, London",
    date: "22 May 1999",
    headline: "Manchester United 2–0 Newcastle United (won)",
    detail: "Sheringham 11', Scholes 53'. Part of the 1999 Treble.",
    focus: "50% 45%",
    credit: {
      title: "1999 FA Cup Final Manchester United celebrate",
      author: "Michael Cairns",
      licence: "CC BY 2.0",
      url: "https://commons.wikimedia.org/wiki/File:1999_FA_Cup_Final_Manchester_United_celebrate.jpg",
    },
  },
  {
    file: "cl99-line-up.jpg",
    alt: "The Manchester United and Bayern Munich teams lined up before the 1999 Champions League final at the Camp Nou.",
    event: "UEFA Champions League final · Camp Nou, Barcelona",
    date: "26 May 1999",
    headline: "Manchester United 2–1 Bayern Munich (won)",
    detail: "Behind until the 90th minute. Sheringham 90+1', Solskjær 90+3'.",
    credit: {
      title: "1999 UEFA Champions League Final teams line up",
      author: "Seán Murray",
      licence: "CC BY-SA 2.0",
      url: "https://commons.wikimedia.org/wiki/File:1999_UEFA_Champions_League_Final_teams_line_up.jpg",
    },
  },
  {
    file: "cl99-celebration.jpg",
    alt: "Manchester United's players with their medals on the pitch after winning the 1999 Champions League final.",
    event: "UEFA Champions League final · Camp Nou, Barcelona",
    date: "26 May 1999",
    headline: "Manchester United 2–1 Bayern Munich (won)",
    detail: "Two goals in injury time won the European Cup.",
    focus: "50% 55%",
    credit: {
      title: "1999 UEFA Champions League celebration",
      author: "Seán Murray",
      licence: "CC BY-SA 2.0",
      url: "https://commons.wikimedia.org/wiki/File:1999_UEFA_Champions_League_celebration.jpg",
    },
  },
  {
    file: "treble-parade.jpg",
    alt: "Manchester United players and staff holding three trophies on an open-top bus in Manchester.",
    event: "Treble victory parade · Deansgate, Manchester",
    date: "May 1999",
    headline: "The Treble: three trophies in one season",
    detail: "Premier League, FA Cup and Champions League. The first English club to win all three in one season (1998–99).",
    focus: "45% 30%",
    credit: {
      title: "Manchester United Treble celebration",
      author: "Seán Murray",
      licence: "CC BY-SA 2.0",
      url: "https://commons.wikimedia.org/wiki/File:Manchester_United_Treble_celebration.jpg",
    },
  },
  {
    file: "cl08-second-half.jpg",
    alt: "Manchester United attacking Chelsea in the second half of the 2008 Champions League final at the Luzhniki Stadium.",
    event: "UEFA Champions League final · Luzhniki Stadium, Moscow",
    date: "21 May 2008",
    headline: "Manchester United 1–1 Chelsea (won 6–5 on penalties)",
    detail: "Ronaldo 26', Lampard 45'. No goals in extra time.",
    credit: {
      title: "2008 Champions League final second half",
      author: "nathan17",
      licence: "CC BY 2.0",
      url: "https://commons.wikimedia.org/wiki/File:2008_Champions_League_final_second_half.jpg",
    },
  },
  {
    file: "cl08-in-possession.jpg",
    alt: "Manchester United in possession against Chelsea during the 2008 Champions League final in Moscow.",
    event: "UEFA Champions League final · Luzhniki Stadium, Moscow",
    date: "21 May 2008",
    headline: "Manchester United 1–1 Chelsea (won 6–5 on penalties)",
    detail: "United's third European Cup.",
    credit: {
      title: "2008 0521 Moscow 43",
      author: "peatc",
      licence: "CC BY-SA 2.0",
      url: "https://commons.wikimedia.org/wiki/File:2008_0521_Moscow_43.jpg",
    },
  },
  {
    file: "el17-first-half.jpg",
    alt: "The 2017 Europa League final between Ajax and Manchester United at the Friends Arena in Stockholm.",
    event: "UEFA Europa League final · Friends Arena, Stockholm",
    date: "24 May 2017",
    headline: "Manchester United 2–0 Ajax (won)",
    detail: "Pogba 18', Mkhitaryan 48'.",
    credit: {
      title: "2017 UEFA Europa League Final first half",
      author: "HonorTheKing",
      licence: "CC BY-SA 4.0",
      url: "https://commons.wikimedia.org/wiki/File:2017_UEFA_Europa_League_Final_first_half.jpg",
    },
  },
];
