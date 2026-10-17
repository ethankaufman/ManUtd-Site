import photosJson from "./stadium-photos.json";

/**
 * The Old Trafford chapter's content: the stadium, the grounds before it, and the training grounds.
 * Every statement was taken from the sources named in `SOURCES` (read in October 2026). Where a source only
 * reports something, the text says "reported". Photos are free-licensed pictures from Wikimedia Commons.
 */

export type Source = { label: string; url: string };
export type Entry = { when: string; text: string };
export type Photo = { src: string; shows: string; author: string; licence: string; licenceUrl: string; page: string };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
type PhotoEntry = { shows: string; title: string; author: string; licence: string; licence_url: string; page: string };
const PHOTOS = photosJson as Record<string, PhotoEntry>;

export function stadiumPhoto(key: string): Photo | null {
  const p = PHOTOS[key];
  return p ? { src: `${BASE}/stadium/${key}.jpg`, shows: p.shows, author: p.author, licence: p.licence, licenceUrl: p.licence_url, page: p.page } : null;
}

const W = "https://en.wikipedia.org/wiki/";
export const SOURCES: Record<string, Source> = {
  ot: { label: "Wikipedia: Old Trafford", url: W + "Old_Trafford" },
  north: { label: "Wikipedia: North Road", url: W + "North_Road,_Manchester" },
  bank: { label: "Wikipedia: Bank Street (football ground)", url: W + "Bank_Street_(football_ground)" },
  maine: { label: "Wikipedia: Maine Road", url: W + "Maine_Road" },
  cliff: { label: "Wikipedia: The Cliff (training ground)", url: W + "The_Cliff_(training_ground)" },
  carrington: { label: "Wikipedia: Trafford Training Centre", url: W + "Trafford_Training_Centre" },
  carringtonArch: { label: "ArchDaily: Foster + Partners redesigns Carrington (12 August 2025)", url: "https://www.archdaily.com/1033028/foster-plus-partners-redesigns-manchester-uniteds-carrington-training-complex" },
};

// ---------------------------------------------------------------------------------------------
// Old Trafford
// ---------------------------------------------------------------------------------------------

export const GLANCE: [string, string][] = [
  ["Home since", "1910. The first match was on 19 February 1910: Liverpool won 4–3."],
  ["Capacity", "About 74,000 (74,158 according to Wikipedia): the largest club football stadium in the UK."],
  ["Nickname", "The “Theatre of Dreams”, a name given by Bobby Charlton."],
  ["Architect", "Archibald Leitch, who designed several other stadiums."],
  ["Record crowd", "76,962 at the 1939 FA Cup semi-final between Wolverhampton Wanderers and Grimsby Town, 25 March 1939."],
  ["A full house", "76,098 watched United beat Blackburn Rovers 4–1 on 31 March 2007, leaving just 114 seats empty."],
];

export const OT_STORY: Entry[] = [
  {
    when: "1909",
    text: "Chairman John Henry Davies decided Bank Street was not fit for a team that had just won the First Division and the FA Cup, and paid for a new stadium on land beside the Bridgewater Canal, off the Warwick Road. Leitch drew it for 100,000 spectators, but the cost (about £60,000 including the land) was rising, so on the suggestion of club secretary J. J. Bentley the capacity was cut to about 80,000.",
  },
  { when: "19 February 1910", text: "The stadium’s first match was against Liverpool, who won 4–3. Sandy Turnbull scored the first goal at Old Trafford." },
  { when: "1936–38", text: "A £35,000 refurbishment in 1936 gave the United Road stand (now the Sir Alex Ferguson Stand) its first roof, an 80-yard one. Roofs were added to the south corners in 1938." },
  {
    when: "1940–49",
    text: "In the Second World War the stadium was requisitioned by the military as a depot. A German bombing raid on Trafford Park on 22 December 1940 damaged it so badly that a Christmas Day game with Stockport County had to be played at Stockport. United shared Manchester City’s Maine Road until the first game back at Old Trafford on 24 August 1949, a 3–0 win over Bolton Wanderers watched by 41,748.",
  },
  { when: "1950s", text: "The Main Stand had its roof back by 1951 and the Stretford End was roofed in 1959. The first match under floodlights at Old Trafford was against Bolton Wanderers on 25 March 1957." },
  { when: "1968 and 1970", text: "Old Trafford hosted the second leg of the 1968 Intercontinental Cup, when Estudiantes de La Plata drew 1–1 to win the trophy, and the 1970 FA Cup final replay, which Chelsea won 2–1 against Leeds United in front of 62,078." },
  { when: "1971", text: "A knife-throwing incident forced the club to put up the country’s first perimeter fence, keeping fans off the pitch." },
  {
    when: "1990–96",
    text: "The capacity had already fallen from the original 80,000 to about 60,000 by the 1980s, and the Taylor Report of 1990, which meant every First and Second Division ground had to become all-seater, cut it further. The Stretford End was rebuilt in 1992–93. In 1995 the old North Stand was demolished and replaced, ready for Euro 96, by a three-tier stand holding about 25,500 that cost £18.65 million.",
  },
  { when: "2000", text: "A second tier on the East Stand opened in January 2000, and a second tier on the West Stand (the Stretford End) followed, taking the capacity to 68,217." },
  { when: "2003", text: "Old Trafford hosted its first major European final, the Champions League final between Milan and Juventus." },
  { when: "2005–06", text: "The latest expansion added around 8,000 seats with second tiers in the north-west and north-east corners, taking the capacity to 76,212. A reorganisation of the seating in 2009 trimmed it to 75,957." },
  { when: "19 February 2010", text: "Old Trafford’s 100th anniversary. A time capsule was buried near the centre tunnel at the Fulham game on 14 March." },
  { when: "2012 and 2022", text: "The 2012 Olympic football tournament was played here, including a women’s semi-final, the first women’s internationals at Old Trafford, and so was UEFA Women’s Euro 2022. United’s women’s team played their first game here on 27 March 2021." },
];

export const ALSO_HOSTED = "Matches at the 1966 World Cup and Euro 96, the 2003 Champions League final, the 2012 Olympics and Women’s Euro 2022, England internationals (14 of England’s 34 home games between 2001 and 2007, while Wembley was rebuilt), and, since 1987, the Rugby League’s season-ending final (the Super League Grand Final and, before it, the Premiership Final).";

export const STANDS: { name: string; also: string; text: string; photo?: string }[] = [
  {
    name: "Sir Alex Ferguson Stand",
    also: "North Stand, formerly the United Road stand",
    text: "Three tiers and about 26,000 spectators, the largest of the four. It houses the Red Café and the club museum, and a statue of Ferguson by Philip Jackson was put up outside on 23 November 2012 in recognition of his being the club’s longest-serving manager.",
    photo: "ferguson-stand",
  },
  {
    name: "Sir Bobby Charlton Stand",
    also: "South Stand, formerly the Main Stand",
    text: "The only stand with a single tier, because of construction restrictions. It holds most of the executive suites and the television gantry, and the tunnel is in its south-west corner. The tunnel was renamed the Munich Tunnel on 6 February 2008 for the 50th anniversary of the air disaster, and the stand took Charlton’s name on 3 April 2016, before the home game with Everton.",
    photo: "munich-tunnel",
  },
  {
    name: "The Stretford End",
    also: "West Stand",
    text: "The best-known stand and the home of the loudest fans. Designed for 20,000, it was the last stand to be covered and the last all-terraced one before the move to seating in the early 1990s. Rebuilt in 1992–93, it got its second tier in 2000. There is a statue of Denis Law, who was nicknamed “King of the Stretford End”, on the concourse of its upper tier.",
    photo: "stretford-end",
  },
  {
    name: "East Stand",
    also: "the Scoreboard End",
    text: "Holds nearly 12,000. It has a tinted-glass front with the club’s offices behind it, the megastore at its base and a statue of Sir Matt Busby above, overlooking the forecourt. A plaque to the victims of the Munich air disaster is at the south end, and the Munich Clock is where the East and South Stands meet.",
  },
];

export const LANDMARKS: { title: string; text: string; photo: string }[] = [
  { title: "The Munich Clock", text: "Stopped at the time of the 1958 air disaster, at the junction of the East and South Stands.", photo: "munich-clock" },
  { title: "The United Trinity", text: "The statue of Best, Law and Charlton outside the ground.", photo: "united-trinity" },
];

export const OT_SOURCE_KEYS = ["ot", "maine"];

// ---------------------------------------------------------------------------------------------
// The grounds before Old Trafford
// ---------------------------------------------------------------------------------------------

export type Ground = { name: string; years: string; place: string; photo?: string; noPhoto?: string; facts: string[]; sources: string[] };

export const GROUNDS: Ground[] = [
  {
    name: "North Road",
    years: "1878 to 1893",
    place: "Newton Heath, Manchester",
    photo: "north-road",
    facts: [
      "The first home of the club, then Newton Heath LYR, from its foundation in 1878. The site belonged to the Manchester Cathedral authorities and was next to the railway company’s wagon works; the railway paid a nominal rent and leased it to the club.",
      "It was “a bumpy, stony patch in summer, and a muddy, heavy swamp in the rainy months”, and often clouded in steam from passing trains. Players changed in The Three Crowns pub, a few hundred yards away on Oldham Road.",
      "The ground held about 12,000 at first and about 15,000 after stands were added in 1891. Without the railway company’s support the club could not afford the rent and was evicted, moving to Bank Street in 1893.",
    ],
    sources: ["north"],
  },
  {
    name: "Bank Street",
    years: "1893 to 1910",
    place: "Clayton, Manchester",
    noPhoto: "There is no free-licensed photograph of Bank Street. The site is now the BMX arena of the National Cycling Centre, and a plaque on a house wall on Bank Street marks the old ground.",
    facts: [
      "The second home ground, also known as Bank Lane, with a capacity of around 50,000. Newton Heath’s first Football League match there was on 1 September 1893: a 3–2 win over Burnley in front of 10,000, in which Alf Farman scored a hat-trick, all of Newton Heath’s goals.",
      "Neighbouring factories sent clouds of fumes over the pitch, and the ground was in poor repair by the end. Shortly after the club moved out, the main stand blew down in a storm.",
      "John Henry Davies, who owned the club, believed Bank Street could not be expanded enough, so in 1910 the club moved to Old Trafford.",
    ],
    sources: ["bank"],
  },
  {
    name: "Maine Road",
    years: "1941 to 1949",
    place: "Moss Side, Manchester (Manchester City’s ground)",
    photo: "maine-road",
    facts: [
      "After the Blitz damage to Old Trafford, United shared Manchester City’s ground until the first game back at Old Trafford in August 1949.",
      "The highest attendance for a league game at Maine Road, 83,260, was for Manchester United against Arsenal on 17 January 1948.",
      "United also used Maine Road for three of their four home games in the 1956–57 European Cup, until floodlights were installed at Old Trafford as UEFA required. Its last FA Cup semi-final was in April 1994, when United beat Oldham Athletic 4–1 in a replay.",
    ],
    sources: ["maine", "ot"],
  },
];

// ---------------------------------------------------------------------------------------------
// Carrington and The Cliff
// ---------------------------------------------------------------------------------------------

export const CARRINGTON_GLANCE: [string, string][] = [
  ["What it is", "Manchester United’s training ground and academy headquarters, officially the Trafford Training Centre but known simply as Carrington."],
  ["Where", "Near the village of Carrington, Trafford, Greater Manchester: less than 10 miles from Old Trafford."],
  ["Opened", "The first team moved into the main building in the summer of 2000; the Academy building followed in 2002."],
  ["Size", "108 acres, of which 85 are used by the club (the rest is a small nature reserve kept with the Cheshire Wildlife Trust)."],
  ["Pitches", "14: twelve grass, one outdoor floodlit and heated all-weather pitch, and one indoor pitch, plus a goalkeeper training area."],
  ["People", "About 300 people work there every day."],
];

export const CARRINGTON_STORY: Entry[] = [
  { when: "1938–1999", text: "The club trained at The Cliff in Broughton, Salford, on the banks of the River Irwell. United rented it from 1938 and bought it in 1951; floodlights went up there before they did at Old Trafford." },
  { when: "Late 1990s", text: "Alex Ferguson felt The Cliff could not meet the Premier League’s demands in the 21st century and disliked the lack of privacy: journalists were there daily, opposition scouts could watch training and supporters asked for autographs. The club bought more than 100 acres of secluded land at Carrington." },
  { when: "1999–2002", text: "Construction began in 1999 on a £22 million budget: £14 million for the main building (first team), which opened in the summer of 2000, and £8 million for the Academy facility, opened in 2002 by Sir Bobby Charlton." },
  { when: "2013", text: "A £25 million medical and sports science centre was completed, with a hospital wing and sports science department. Over £60 million had now been spent on the site." },
  { when: "2023", text: "A new facility specifically designed for the women’s first team opened." },
  { when: "June 2024 to August 2025", text: "The club announced a £50 million modernisation of the men’s first-team building, led by Sir Jim Ratcliffe and designed by Foster + Partners. On 8 August 2025 the club inaugurated the upgraded training centre, saying it was delivered on time and within budget." },
];

export const CARRINGTON_NOW: string[] = [
  "The 1999 first-team building was kept and reworked: larger windows and rooflights, timber panelling, and new building systems.",
  "Ground floor: a hydration and nutrition area, a gym with an altitude room, hydrotherapy pools, new changing areas, medical suites and recovery spaces, and a players’ entrance on the south side linking the car park to the dressing rooms.",
  "First floor: a players’ lounge reached by a spiral staircase, with a glass front and an outdoor terrace over the training pitches, a dining area connected to a professional kitchen, and open-plan coaching offices. Above are a media area with a press conference room and a studio for TV and video.",
  "Foster + Partners say the layout “prioritizes openness, natural daylight, and intuitive circulation”.",
];

export const CARRINGTON_SECURITY = "Carrington has a reputation as one of the most secretive training grounds in Europe, nicknamed “Fortress Carrington”: an 8-metre (26 ft) security wall, cameras, and more than 30,000 trees planted round the site so that nobody can see in.";
