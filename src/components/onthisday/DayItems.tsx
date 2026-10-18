import Link from "next/link";

import type { DayItem, DayMatch } from "@/lib/onthisday";
import { UNITED } from "@/lib/season";

const CHIP = {
  W: "bg-united-red text-white",
  D: "bg-white/15 text-white",
  L: "border border-white/30 text-white/70",
} as const;

/** Home side first, like every match list on the site; a final at a neutral ground puts United first. */
function Score({ m }: { m: DayMatch }) {
  const unitedFirst = m.home !== false;
  const left = unitedFirst ? { name: UNITED, goals: m.us } : { name: m.opp, goals: m.them };
  const right = unitedFirst ? { name: m.opp, goals: m.them } : { name: UNITED, goals: m.us };
  return (
    <p className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm sm:gap-3 sm:text-base">
      <span className={`break-words text-right ${left.name === UNITED ? "font-bold text-white" : "text-white/75"}`}>{left.name}</span>
      <span className="min-w-[3.5rem] text-center font-display text-lg tracking-wide text-white">
        {left.goals} – {right.goals}
      </span>
      <span className={`break-words ${right.name === UNITED ? "font-bold text-white" : "text-white/75"}`}>{right.name}</span>
    </p>
  );
}

function Item({ item }: { item: DayItem }) {
  const year = item.date.slice(0, 4);
  if (item.kind === "moment") {
    return (
      <li className="flex gap-4 border-b border-white/10 py-5 last:border-b-0 sm:gap-6">
        <span className="w-16 flex-none font-display text-2xl leading-none text-united-gold sm:w-20 sm:text-3xl">{year}</span>
        <div className="min-w-0 flex-1 border-l-2 border-united-gold pl-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-united-gold">Club history</p>
          <p className="mt-1 font-display text-xl uppercase tracking-wide text-white">{item.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/75">{item.text}</p>
        </div>
      </li>
    );
  }
  const extra = [item.aet ? "after extra time" : null, item.pens ? `${item.pens[0] > item.pens[1] ? "won" : "lost"} ${item.pens[0]}–${item.pens[1]} on penalties` : null].filter(Boolean).join(", ");
  return (
    <li className="flex gap-4 border-b border-white/10 py-5 last:border-b-0 sm:gap-6">
      <span className="w-16 flex-none font-display text-2xl leading-none text-white sm:w-20 sm:text-3xl">{year}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/55">
            {item.comp}
            {item.round ? <span className="normal-case tracking-normal"> · {item.round}</span> : null}
          </p>
          <span className={`flex h-6 w-6 flex-none items-center justify-center font-mono text-xs font-bold ${CHIP[item.res]}`}>{item.res}</span>
        </div>
        <Score m={item} />
        {extra ? <p className="mt-1 text-center text-xs text-white/60">{extra}</p> : null}
        {item.scorers.length ? <p className="mt-1.5 text-center text-xs leading-relaxed text-white/65">{item.scorers.join(", ")}</p> : null}
        <p className="mt-1.5 text-center text-xs text-white/45">
          {item.venue ?? ""}
          {item.venue && parseInt(item.season, 10) >= 1992 ? " · " : ""}
          {parseInt(item.season, 10) >= 1992 ? (
            <Link href={`/matches/${item.season}/`} className="whitespace-nowrap underline underline-offset-2 hover:text-white">
              Season {item.season.replace("-", "–")}
            </Link>
          ) : null}
        </p>
      </div>
    </li>
  );
}

export default function DayItems({ items }: { items: DayItem[] }) {
  return (
    <ul>
      {items.map((it, i) => (
        <Item key={`${it.date}-${i}`} item={it} />
      ))}
    </ul>
  );
}
