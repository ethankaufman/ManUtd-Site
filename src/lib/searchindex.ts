import { CHAPTERS } from "@/lib/chapters";
import { CAPTAINS, dashed, FINALS, SEASONS, TIMELINE } from "@/lib/club";
import { getSquad } from "@/lib/data";
import { opponentsFrom } from "@/lib/h2h";
import { TROPHIES } from "@/lib/honours";
import { LEGENDS, positionName, spellText } from "@/lib/legends";
import { MANAGERS, STATUS_LABEL, when } from "@/lib/managers";
import { buildDayIndex } from "@/lib/onthisday";

/**
 * The site-search index: one small entry for everything a visitor might look for, written once at build time into
 * /search-index.json (src/app/search-index.json/route.ts). The search box in the menu fetches it and searches in the browser.
 *   t = title, k = kind (shown as a badge), u = link, s = a line of detail, w = extra words that should also find it
 */
export type SearchEntry = { t: string; k: string; u: string; s?: string; w?: string };

const DIVISION: Record<string, string> = { Prem: "Premier League", "Div 1": "First Division", "Div 2": "Second Division", "—": "No league" };

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const out: SearchEntry[] = [];

  // pages
  for (const c of CHAPTERS) out.push({ t: c.title, k: "Chapter", u: `/${c.slug}/`, s: c.teaser, w: `chapter ${Number(c.number)}` });
  out.push({ t: "On this day", k: "Page", u: "/on-this-day/", s: "What United did on any date, in every year", w: "date calendar today history" });
  out.push({ t: "Head to head", k: "Page", u: "/head-to-head/", s: "United's record against any club since 1992–93", w: "versus record rivals derby" });

  // the squad
  const squad = await getSquad();
  for (const p of squad?.players ?? []) {
    out.push({ t: p.name, k: "Player", u: `/squad/${p.slug}/`, s: [p.position, p.number ? `No. ${p.number}` : null, p.nationality].filter(Boolean).join(" · "), w: `shirt number ${p.number ?? ""} squad` });
  }

  // legends
  for (const l of LEGENDS) out.push({ t: l.name, k: "Legend", u: `/legends/${l.slug}/`, s: `${positionName(l.pos)} · ${spellText(l.career)}`, w: l.tagline });

  // managers (one page, each opens from its address)
  for (const m of MANAGERS) {
    out.push({ t: m.name, k: "Manager", u: `/managers/#${m.slug}`, s: `${STATUS_LABEL[m.status]} · ${when(m.from)}–${m.current ? "present" : when(m.to)}`, w: "manager boss" });
  }

  // seasons: matches from 1992-93, the history table before that
  for (const s of SEASONS) {
    const modern = s.season >= "1992-93";
    const label = dashed(s.season);
    out.push({
      t: `Season ${label}`,
      k: "Season",
      u: modern ? `/matches/${s.season}/` : "/history/#seasons",
      s: `${DIVISION[s.division] ?? s.division}${s.pos && s.pos !== "—" ? `, ${s.pos}` : ""}${modern ? " · every match" : ""}`,
      w: `${s.season} ${s.season.replace("-", "/")} ${parseInt(s.season, 10) + 1} ${s.scorers.join(" ")}`, // "1999" also finds 1998–99
    });
  }

  // every club United have played since 1992-93
  for (const o of opponentsFrom(await buildDayIndex())) {
    out.push({ t: o.name, k: "Head to head", u: `/head-to-head/#${o.slug}`, s: `United v ${o.name} · ${o.matches.length} match${o.matches.length === 1 ? "" : "es"} since 1992–93`, w: "versus record" });
  }

  // finals, captains, the timeline, trophies
  for (const f of FINALS) {
    out.push({ t: f.title, k: "Final", u: "/history/#finals", s: `v ${f.opponent} · ${f.result}`, w: `${f.comp_name} ${f.venue} ${f.city}` });
  }
  for (const c of CAPTAINS) out.push({ t: c.name, k: "Captain", u: "/history/#captains", s: `Captain ${c.from}–${c.to}`, w: "skipper" });
  for (const t of TIMELINE) out.push({ t: t.title, k: "History", u: "/history/", s: t.when, w: t.text });
  for (const t of TROPHIES) out.push({ t: t.name, k: "Honour", u: "/honours/", s: `${t.entries.length} win${t.entries.length === 1 ? "" : "s"}`, w: "trophy won titles" });

  // the History chapter's tabs
  out.push({ t: "Finals", k: "History", u: "/history/#finals", s: "Every cup final United have played, with date, venue and score", w: "cup finals wembley" });
  out.push({ t: "Every season", k: "History", u: "/history/#seasons", s: "League record, cup runs and top scorer for every season from 1886–87", w: "table positions" });
  out.push({ t: "Captains", k: "History", u: "/history/#captains", s: "The club captains since 1878", w: "skipper armband" });
  out.push({ t: "Competitions", k: "History", u: "/history/#competitions", s: "Every competition United have played in and how they did", w: "leagues cups europe" });
  out.push({ t: "Timeline", k: "History", u: "/history/#timeline", s: "The club's story in 24 moments", w: "history story" });

  // the stadium chapter's four tabs
  out.push({ t: "Old Trafford", k: "Stadium", u: "/stadium/#old", s: "The Theatre of Dreams, opened 1910", w: "ground stands memorials Sir Matt Busby Way Stretford" });
  out.push({ t: "The new stadium", k: "Stadium", u: "/stadium/#new", s: "The planned new home at Trafford Wharfside", w: "Foster Partners design Wharfside rebuild" });
  out.push({ t: "North Road, Bank Street and Maine Road", k: "Stadium", u: "/stadium/#before", s: "The grounds before Old Trafford", w: "earlier grounds Newton Heath Clayton" });
  out.push({ t: "Carrington", k: "Stadium", u: "/stadium/#carrington", s: "The training ground, and The Cliff before it", w: "training centre Cliff Broughton" });

  return out;
}
