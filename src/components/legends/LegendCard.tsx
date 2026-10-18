import Link from "next/link";

import { positionName, spellText, type Legend } from "@/lib/legends";

/** One legend on the index: portrait, name, years at United and the headline numbers. */
export default function LegendCard({ l }: { l: Legend }) {
  return (
    <li>
      <Link
        href={`/legends/${l.slug}`}
        className="glow-red group flex h-full flex-col border border-white/15 bg-[#0c0c0c] transition duration-200 hover:-translate-y-0.5 hover:border-united-red"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b border-white/10 bg-black">
          {l.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.photo.src} alt={l.photo.shows} loading="lazy" className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]" />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-2xl uppercase leading-tight tracking-wide text-white">{l.name}</h3>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-united-red">
            {positionName(l.pos)} · <span className="whitespace-nowrap">{spellText(l.career)}</span>
          </p>
          <p className="mt-2 flex-1 text-sm leading-snug text-white/65">{l.tagline}</p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-white/50">
            {l.apps} apps · {l.goals} goals · {l.trophies.length} trophies
          </p>
        </div>
      </Link>
    </li>
  );
}
