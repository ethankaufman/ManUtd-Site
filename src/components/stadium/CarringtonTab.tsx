import { CARRINGTON_GLANCE, CARRINGTON_NOW, CARRINGTON_SECURITY, CARRINGTON_STORY, SOURCES } from "@/lib/stadium";
import PhotoFigure from "./PhotoFigure";
import { EntryList, GlanceGrid, Heading, Sources } from "./Parts";

/** Carrington, the training ground, with its history from The Cliff and the 2025 upgrade. */
export default function CarringtonTab() {
  return (
    <div className="space-y-10">
      <PhotoFigure name="carrington" wide />
      <section aria-label="At a glance">
        <Heading>At a glance</Heading>
        <GlanceGrid items={CARRINGTON_GLANCE} />
      </section>

      <section aria-label="The story">
        <Heading>From The Cliff to Carrington</Heading>
        <p className="mb-3 text-sm text-white/60">Click a date to read it.</p>
        <EntryList entries={CARRINGTON_STORY} />
      </section>

      <section aria-label="The upgraded building">
        <Heading>The upgraded first-team building</Heading>
        <ul className="space-y-2 text-sm leading-relaxed text-white/80">
          {CARRINGTON_NOW.map((t) => (
            <li key={t} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-none bg-united-red" aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{CARRINGTON_SECURITY}</p>
      </section>

      <section aria-label="The old training ground">
        <Heading>The old training ground: The Cliff</Heading>
        <div className="grid gap-4 sm:grid-cols-[18rem_1fr]">
          <PhotoFigure name="the-cliff" />
          <p className="text-sm leading-relaxed text-white/80">
            The Cliff, in Broughton, Salford, was the club’s main training ground until 1999 and still hosts some academy matches. It was once the home of the rugby league club Broughton Rangers, who
            played there from 1913 to 1933. In 1952 the youth team played FA Youth Cup ties under its floodlights, and in the second round that season recorded the competition’s biggest ever win, 23–0 against
            Nantwich Town.
          </p>
        </div>
      </section>

      <Sources items={[SOURCES.carrington, SOURCES.cliff, SOURCES.carringtonArch]} note="There are no free photographs of the upgraded Carrington interiors: the architects’ pictures are not free to use." />
    </div>
  );
}
