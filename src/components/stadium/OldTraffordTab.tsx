import { ALSO_HOSTED, GLANCE, LANDMARKS, OT_STORY, SOURCES, STANDS } from "@/lib/stadium";
import PhotoFigure from "./PhotoFigure";
import { EntryList, GlanceGrid, Heading, Sources } from "./Parts";

/** Old Trafford today and how it got here: facts, the story in dated rows, the four stands and the memorials. */
export default function OldTraffordTab() {
  return (
    <div className="space-y-10">
      <PhotoFigure name="old-trafford-night" wide />
      <section aria-label="At a glance">
        <Heading>At a glance</Heading>
        <GlanceGrid items={GLANCE} />
      </section>

      <section aria-label="The story">
        <Heading>The story, 1909 to today</Heading>
        <p className="mb-3 text-sm text-white/60">Click a date to read it.</p>
        <EntryList entries={OT_STORY} />
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          <span className="font-bold text-white/85">Also hosted:</span> {ALSO_HOSTED}
        </p>
      </section>

      <section aria-label="The four stands">
        <Heading>The four stands</Heading>
        <ul className="grid gap-4 sm:grid-cols-2">
          {STANDS.map((s) => (
            <li key={s.name} className="border border-white/15 bg-[#0c0c0c]">
              {s.photo ? <PhotoFigure name={s.photo} className="p-3 pb-0" /> : null}
              <div className="p-4">
                <h4 className="font-display text-xl uppercase tracking-wide text-white">{s.name}</h4>
                <p className="font-mono text-[11px] uppercase tracking-wider text-white/45">{s.also}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Memorials">
        <Heading>Memorials and statues</Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          {LANDMARKS.map((l) => (
            <div key={l.title}>
              <PhotoFigure name={l.photo} />
              <h4 className="mt-2 font-display text-lg uppercase tracking-wide text-white">{l.title}</h4>
              <p className="text-sm text-white/70">{l.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Sources items={[SOURCES.ot, SOURCES.maine]} note="The stadium facts come from Wikipedia’s articles (CC BY-SA), which quote the club’s own history and contemporary reports. Capacity figures change as seating is reorganised." />
    </div>
  );
}
