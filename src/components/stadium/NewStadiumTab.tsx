import { DESIGN, IMAGES_NOTE, NEW_GLANCE, NEW_SOURCES, NEW_TIMELINE, OLD_GROUND_FUTURE, WIDER, type Fact, type Status } from "@/lib/newstadium";
import { EntryList, Heading, Sources } from "./Parts";

function Chip({ status }: { status: Status }) {
  return (
    <span
      className={`flex-none border px-1.5 py-px font-mono text-[10px] uppercase tracking-widest ${
        status === "official" ? "border-united-red/70 text-united-red" : "border-white/30 text-white/55"
      }`}
      title={status === "official" ? "Said by the club or by Trafford Council" : "Reported by news organisations"}
    >
      {status}
    </span>
  );
}

function FactList({ facts }: { facts: Fact[] }) {
  return (
    <ul className="divide-y divide-white/10 border-y border-white/15">
      {facts.map((f) => (
        <li key={f.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr_auto] sm:gap-4">
          <span className="font-display text-lg uppercase tracking-wide text-white">{f.label}</span>
          <span className="text-sm leading-relaxed text-white/80">{f.text}</span>
          <span className="sm:text-right">
            <Chip status={f.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The planned new stadium: what is official, what is only reported, and where the project stands. */
export default function NewStadiumTab() {
  return (
    <div className="space-y-10">
      <div className="border-l-2 border-united-red bg-white/[0.03] p-4 text-sm leading-relaxed text-white/80">
        <p className="font-display text-xl uppercase tracking-wide text-white">A plan, not yet a building</p>
        <p className="mt-2">
          Manchester United intend to build a new 100,000-seat stadium beside Old Trafford, designed by Foster + Partners. It has not yet been through planning, the design may still change, and
          no opening date has been fixed. This page was written from the sources listed below in October 2026, and the project is still moving. Each statement is marked{" "}
          <span className="text-united-red">official</span> (said by the club or by Trafford Council) or <span className="text-white/60">reported</span> (from news organisations).
        </p>
      </div>

      <section aria-label="At a glance">
        <Heading>At a glance</Heading>
        <FactList facts={NEW_GLANCE} />
      </section>

      <section aria-label="The design">
        <Heading>The design</Heading>
        <FactList facts={DESIGN} />
        <p className="mt-3 text-xs leading-relaxed text-white/50">{IMAGES_NOTE}</p>
      </section>

      <section aria-label="The area around it">
        <Heading>The area around it</Heading>
        <FactList facts={WIDER} />
      </section>

      <section aria-label="How we got here">
        <Heading>How it got here, and what comes next</Heading>
        <EntryList
          entries={NEW_TIMELINE}
          render={(e) => (
            <div className="flex flex-wrap items-start gap-3">
              <p className="max-w-3xl flex-1 text-base leading-relaxed text-white/85">{e.text}</p>
              {e.status ? <Chip status={e.status as Status} /> : null}
            </div>
          )}
        />
      </section>

      <section aria-label="Old Trafford's future">
        <Heading>And Old Trafford?</Heading>
        <p className="max-w-3xl text-sm leading-relaxed text-white/80">{OLD_GROUND_FUTURE}</p>
      </section>

      <Sources items={Object.values(NEW_SOURCES)} />
    </div>
  );
}
