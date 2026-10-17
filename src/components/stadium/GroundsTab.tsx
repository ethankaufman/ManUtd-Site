import { GROUNDS, SOURCES } from "@/lib/stadium";
import PhotoFigure from "./PhotoFigure";
import { Sources } from "./Parts";

/** The three grounds United used before Old Trafford: North Road, Bank Street and (during the war) Maine Road. */
export default function GroundsTab() {
  return (
    <div className="space-y-10">
      <p className="max-w-3xl text-sm text-white/65">
        Old Trafford was the club’s third home. Before it came two grounds in the east of Manchester, and for eight years after the Blitz United borrowed a fourth.
      </p>
      {GROUNDS.map((g) => (
        <article key={g.name} className="grid gap-6 border-t border-white/15 pt-6 md:grid-cols-[18rem_1fr]">
          <div>
            {g.photo ? (
              <PhotoFigure name={g.photo} />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-white/10 bg-black px-4 text-center text-xs leading-relaxed text-white/45">{g.noPhoto}</div>
            )}
          </div>
          <div>
            <h3 className="font-display text-3xl uppercase tracking-wide text-white">{g.name}</h3>
            <p className="font-mono text-xs uppercase tracking-wider text-united-red">
              {g.years} · {g.place}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/80">
              {g.facts.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-none bg-united-red" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {g.photo && g.noPhoto ? <p className="mt-2 text-xs text-white/45">{g.noPhoto}</p> : null}
          </div>
        </article>
      ))}
      <Sources items={[SOURCES.north, SOURCES.bank, SOURCES.maine]} />
    </div>
  );
}
