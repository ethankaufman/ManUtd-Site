import Link from "next/link";

import OverheadKicks from "@/components/kick3d/OverheadKicks";
import { groupTrophies, LEGENDS, nationName, positionName, spellText, yearsAtClub, type Legend } from "@/lib/legends";

function Heading({ children }: { children: string }) {
  return <h2 className="mb-4 font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">{children}</h2>;
}

function Stat({ value, label }: { value: string | number | string[]; label: string }) {
  return (
    <div className="border border-white/15 bg-[#0c0c0c] px-2 py-4 text-center">
      <div className="font-display text-2xl leading-tight text-united-gold sm:text-3xl">
        {Array.isArray(value)
          ? value.map((v) => (
              <span key={v} className="block whitespace-nowrap">
                {v}
              </span>
            ))
          : value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">{label}</div>
    </div>
  );
}

/** One legend's page: portrait, the numbers, his story, what he won at United, and (for Rooney) the 3D kick. */
export default function LegendView({ l }: { l: Legend }) {
  const i = LEGENDS.findIndex((x) => x.slug === l.slug);
  const prev = LEGENDS[(i + LEGENDS.length - 1) % LEGENDS.length];
  const next = LEGENDS[(i + 1) % LEGENDS.length];
  const groups = groupTrophies(l.trophies);
  const hasShared = l.trophies.some((t) => t.shared);
  const years = yearsAtClub(l.career);
  const firstTeamDiffers = spellText(l.spells) !== spellText(l.career);

  return (
    <>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 text-left md:grid-cols-[17rem_1fr]">
        <div>
          {l.photo ? (
            <figure>
              <div className="aspect-[3/4] overflow-hidden border border-white/15 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.photo.src} alt={l.photo.shows} className="h-full w-full object-cover object-top" />
              </div>
              <figcaption className="mt-1.5 text-[11px] leading-snug text-white/45">
                {l.photo.shows}. Photo: {l.photo.author},{" "}
                <a href={l.photo.licenceUrl || l.photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                  {l.photo.licence}
                </a>
                ,{" "}
                <a href={l.photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                  Wikimedia Commons
                </a>
              </figcaption>
            </figure>
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="font-display text-2xl uppercase tracking-wide text-united-red sm:text-3xl">{l.tagline}</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-white/55">
            {positionName(l.pos)} · {nationName(l.nation)}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Stat value={l.career} label="At United" />
            <Stat value={`~${years}`} label="Years" />
            <Stat value={l.apps} label="Appearances" />
            <Stat value={l.goals} label="Goals" />
            <Stat value={l.trophies.length} label="Trophies" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            Years at United are from the player’s Wikipedia career table (from signing to leaving).{firstTeamDiffers ? ` His first-team years, from his debut, were ${spellText(l.spells)}.` : ""} Appearances and goals are in all
            competitions ({l.starts} starts, {l.subs} as a substitute), from Wikipedia’s list of players with 100 or more appearances.
          </p>
          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-white/85">
            {l.story.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 w-full max-w-5xl space-y-12 px-4 text-left">
        <section aria-label="Trophies at United">
          <Heading>Trophies at United</Heading>
          {groups.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <li key={g.trophy} className="border border-white/15 bg-[#0c0c0c] p-4">
                  <h3 className="font-display text-lg uppercase tracking-wide text-white">{g.trophy}</h3>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl leading-none text-united-gold">{g.items.length}</span>
                    <span className="text-sm text-white/55">{g.items.length === 1 ? "win" : "wins"}</span>
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">{g.items.map((x) => `${x.label}${x.shared ? "*" : ""}`).join(", ")}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/60">No senior trophies were won with United.</p>
          )}
          {hasShared ? <p className="mt-2 text-xs text-white/40">* a shared Charity Shield</p> : null}
          {l.youthHonours.length ? <p className="mt-3 text-sm text-white/65">With the youth team: {l.youthHonours.map((y) => y.text).join("; ")} (from Wikipedia).</p> : null}
          <p className="mt-3 text-xs leading-relaxed text-white/40">
            The lists follow the honours on {l.name}’s Wikipedia page, which counts the trophies won while he was part of the squad; each one was checked against our own list of United’s finals and titles.
            Totals quoted elsewhere can differ by a trophy or two depending on how they count.
          </p>
        </section>

        {l.awards.length ? (
          <section aria-label="Individual awards">
            <Heading>Individual awards at United</Heading>
            <ul className="divide-y divide-white/10 border-y border-white/15">
              {l.awards
                .slice()
                .sort((a, b) => a.season.localeCompare(b.season))
                .map((a) => (
                  <li key={a.label + a.season} className="flex flex-wrap gap-x-4 py-2 text-sm text-white/85">
                    <span className="w-20 flex-none font-mono text-xs text-united-gold">{a.season}</span>
                    <span>{a.label}</span>
                    {a.detail ? <span className="text-white/50">{a.detail}</span> : null}
                  </li>
                ))}
            </ul>
            <p className="mt-2 text-xs text-white/40">The Ballon d’Or and the Premier League era’s awards (1992 onward); earlier awards are not covered yet.</p>
          </section>
        ) : null}
      </div>

      {l.slug === "wayne-rooney" ? (
        <section aria-label="The overhead kick" className="mt-16 border-t border-white/10 pt-12">
          <h2 className="mb-2 text-center font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">The overhead kick</h2>
          <p className="mx-auto mb-8 max-w-xl px-4 text-center text-white/65">The goal against Manchester City on 12 February 2011, rebuilt in 3D. Drag to look around.</p>
          <OverheadKicks />
        </section>
      ) : null}

      <div className="mx-auto mt-12 w-full max-w-5xl px-4 text-left">
        <p className="text-xs leading-relaxed text-white/45">
          Source:{" "}
          <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(l.wikipedia.replace(/ /g, "_"))}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
            Wikipedia: {l.name}
          </a>{" "}
          (CC BY-SA) for the story and honours, and{" "}
          <a href="https://en.wikipedia.org/wiki/List_of_Manchester_United_F.C._players_(100%2B_appearances)" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
            the list of United players with 100+ appearances
          </a>{" "}
          for the record at the club.
        </p>
        <nav aria-label="More legends" className="mt-8 flex flex-wrap justify-between gap-3 pb-16 font-mono text-xs uppercase tracking-widest">
          <Link href={`/legends/${prev.slug}`} className="border border-white/30 px-5 py-2.5 text-white transition hover:border-white hover:bg-white hover:text-black">
            ← {prev.name}
          </Link>
          <Link href="/legends" className="border border-white/30 px-5 py-2.5 text-white transition hover:border-white hover:bg-white hover:text-black">
            All legends
          </Link>
          <Link href={`/legends/${next.slug}`} className="border border-united-red bg-united-red px-5 py-2.5 text-white transition hover:bg-white hover:text-united-red">
            {next.name} →
          </Link>
        </nav>
      </div>
    </>
  );
}
