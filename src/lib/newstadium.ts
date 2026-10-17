import type { Entry, Source } from "./stadium";

/**
 * Manchester United's planned new stadium. This is a live project and the details are still changing, so every
 * statement is marked "official" (said by the club or by Trafford Council) or "reported" (from news organisations),
 * and the page says it was written from sources read in October 2026.
 *
 * The architects' and the club's pictures of the design are NOT free to use, so none are shown here.
 */

export type Status = "official" | "reported";
export type Fact = { label: string; text: string; status: Status };

export const NEW_SOURCES: Record<string, Source> = {
  npr: { label: "NPR, 11 March 2025: Manchester United announces plans for a new stadium", url: "https://www.npr.org/2025/03/11/nx-s1-5324633/manchester-united-new-soccer-stadium" },
  wallpaper: { label: "Wallpaper*, 12 March 2025: Inside the new Manchester stadium", url: "https://www.wallpaper.com/architecture/public-buildings/new-manchester-united-stadium-foster-partners" },
  archdaily: { label: "ArchDaily, 13 March 2025: Foster + Partners unveils the design", url: "https://www.archdaily.com/1027919/foster-plus-partners-unveils-design-of-new-manchester-united-stadium-in-the-reimagined-old-trafford-neighborhood" },
  sky: { label: "Sky Sports, 22 June 2026: Man Utd secure land for the new stadium", url: "https://www.skysports.com/football/news/13556750/man-utd-secure-land-to-build-new-100-000-seater-stadium" },
  independent: { label: "The Independent (via Yahoo Sports), 9 July 2026: the club’s plans and a possible opening date", url: "https://sports.yahoo.com/articles/man-utd-reveal-location-100-085401709.html" },
  councilPlan: { label: "Trafford Council, 9 July 2026: Wharfside masterplan published", url: "https://www.trafford.gov.uk/news/2026/masterplan-published-regeneration-trafford-wharfside" },
  councilConsult: { label: "Trafford Council: consultation on the draft Wharfside masterplan", url: "https://www.trafford.gov.uk/news/2026/consultation-draft-trafford-wharfside-strategic-masterplan" },
  wikipedia: { label: "Wikipedia: New Trafford Stadium", url: "https://en.wikipedia.org/wiki/New_Trafford_Stadium" },
};

export const NEW_GLANCE: Fact[] = [
  { label: "Name", text: "No official name yet. “New Trafford” is used in a club briefing document, and the press has nicknamed it the “Wembley of the North”.", status: "reported" },
  { label: "Capacity", text: "100,000 seats, which would make it the biggest stadium in the UK (Wembley holds 90,000). Sky Sports ranks that second in Europe, behind Barcelona’s Camp Nou.", status: "official" },
  { label: "Architect", text: "Foster + Partners, who were appointed in September 2024 to lead the masterplan for the area and whose stadium design was unveiled on 11 March 2025.", status: "official" },
  { label: "Where", text: "About 350 metres north-west of Old Trafford, in Trafford Wharfside: a 25-acre triangle of land between Europa Way, Wharfside Way and John Gilbert Way, bought from Indurent.", status: "official" },
  { label: "Cost", text: "About £2 billion, the figure reported at the launch (NPR quoted the CEO at more than $2.5 billion). The club has not given an updated estimate.", status: "reported" },
  { label: "Build time", text: "Five years, using prefabricated parts: about 160 components shipped along the Manchester Ship Canal.", status: "official" },
  { label: "Opening", text: "No date is set. The club’s chief executive, Collette Roche, called 2035 “realistic” but said a date can only be given after planning: “We’ve got to go to planning, and then that’ll give us the date.”", status: "official" },
  { label: "Who pays", text: "United say public money will go to the wider regeneration but not to the stadium itself.", status: "official" },
];

export const DESIGN: Fact[] = [
  { label: "The roof", text: "A vast “umbrella” canopy, tent-shaped, permeable and seemingly lightweight, which according to its architects will harvest solar energy and rainwater. It is also shaped to carry the crowd’s noise out of the stadium.", status: "official" },
  { label: "Three masts", text: "The canopy is held up by three masts that rise like a trident, echoing the club’s emblem. The club says they would make the stadium visible from about 40 kilometres (25 miles) away, “from the outskirts of Liverpool” on a clear day.", status: "official" },
  { label: "A public plaza", text: "Wallpaper* reported that the canopy shelters a public plaza “twice the size of” Trafalgar Square. Sir Norman Foster called it “arguably the largest public space in the world”.", status: "reported" },
  { label: "Open, not a fortress", text: "The architects describe the stadium as open rather than a closed “fortress surrounded by a sea of cars”, as the centrepiece of a new district.", status: "reported" },
  { label: "Still a concept", text: "The first designs were conceptual images and scale models, described as illustrative concepts that guide feasibility work, consultation and planning. In July 2026 Roche said of the design “Is it set in stone? No.”, so the tent-like roof may change.", status: "official" },
];

export const WIDER: Fact[] = [
  { label: "The masterplan", text: "The Trafford Wharfside Strategic Masterplan covers 150 hectares south of Salford Quays and east of the Trafford Park industrial estate, roughly bounded by Europa Way, the Manchester Ship Canal and the Manchester to Liverpool railway line. It includes the new stadium and up to 15,000 homes.", status: "official" },
  { label: "Who made it", text: "Prepared by Trafford Council with architects and urbanists Allies and Morrison, engineers Civic, JLL and landscape architects SLA. It was first shared at an event at Old Trafford.", status: "official" },
  { label: "The district", text: "ArchDaily described a mixed-use district with parks, streets, bridges and waterfront areas, a rebuilt Old Trafford station and a covered public plaza overlooking the Bridgewater Canal.", status: "reported" },
];

export const NEW_TIMELINE: (Entry & { status: Status })[] = [
  { when: "February 2024", text: "Trafford Council announced plans to regenerate the area around Old Trafford and MediaCity, the start of the Wharfside framework.", status: "official" },
  { when: "September 2024", text: "Foster + Partners were appointed to lead the masterplan for the Old Trafford Stadium District.", status: "official" },
  { when: "11 March 2025", text: "United confirmed their ambition to build a new stadium and showed Foster + Partners’ first design as conceptual images and scale models, promising further consultation with fans and residents.", status: "official" },
  { when: "22 June 2026", text: "Sky Sports reported that the club had secured the majority of the land it needs, a 25-acre triangle, and expected no problem buying the rest. Sky said United were expected to keep playing at Old Trafford while the new stadium is built.", status: "reported" },
  { when: "9 July 2026", text: "Trafford Council published the Wharfside masterplan, and the club set out its plans and its “realistic” 2035 target.", status: "official" },
  { when: "28 July to 22 September 2026", text: "Public consultation on the draft masterplan, with drop-in events at Trafford Town Hall, Gorse Hill Studios and Stretford Metros. The council announced on 29 September that the consultation was complete.", status: "official" },
  { when: "Next", text: "The council will consider the consultation responses before deciding on the final masterplan. The stadium itself still needs planning permission, and the club has said it will keep consulting fans on the design.", status: "official" },
];

export const OLD_GROUND_FUTURE =
  "What happens to Old Trafford itself has not been settled in anything I could read. At the March 2025 launch NPR reported that there was no plan to renovate it and that it was “planned for demolition”, while Sky Sports said in June 2026 that United are expected to keep playing there while the new stadium is built. Treat any decision about the old ground as still open.";

export const IMAGES_NOTE =
  "The computer-generated images and scale-model photographs of the design belong to the club and Foster + Partners and are not free to reuse, so they are not shown here. You can see them in the Sky Sports and ArchDaily articles linked below.";
