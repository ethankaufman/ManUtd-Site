import { longDate } from "@/lib/format";
import { trophyPhoto, type Trophy, type Win } from "@/lib/honours";

const score = (s: [number, number]) => `${s[0]}–${s[1]}`;

function how(f: NonNullable<Win["final"]>) {
  const pens = f.pens ? `, ${f.pens[0] > f.pens[1] ? "won" : "lost"} ${Math.max(...f.pens)}–${Math.min(...f.pens)} on penalties` : "";
  return `${score(f.score)}${f.aet ? " after extra time" : ""}${pens}`;
}

function WinRow({ w }: { w: Win }) {
  if (w.table) {
    const t = w.table;
    return (
      <li className="flex flex-wrap gap-x-3 py-1.5 text-sm text-white/80">
        <span className="w-20 flex-none font-mono text-xs text-united-gold">{w.label}</span>
        <span>
          {t.pts} points · won {t.w}, drew {t.d}, lost {t.l} · goals {t.gf}–{t.ga}
        </span>
      </li>
    );
  }
  const f = w.final!;
  const r = f.replay;
  const verb = w.shared ? "Drew with" : "Beat";
  return (
    <li className="py-1.5 text-sm text-white/80">
      <div className="flex flex-wrap gap-x-3">
        <span className="w-20 flex-none font-mono text-xs text-united-gold">{w.label}</span>
        <span>
          {r ? `Beat ${f.opponent} ${how({ ...f, score: r.score, aet: r.aet, pens: r.pens })} in a replay, after a ${score(f.score)} draw${f.aet ? " (after extra time)" : ""}` : `${verb} ${f.opponent} ${how(f)}`}
          {w.shared ? " (trophy shared)" : ""}
        </span>
      </div>
      <p className="pl-0 text-xs text-white/50 sm:pl-[5.75rem]">
        {r
          ? `${longDate(f.date)}, ${[f.venue, f.city].filter(Boolean).join(", ")}; replay ${longDate(r.date)}, ${[r.venue, r.city].filter(Boolean).join(", ")}`
          : `${longDate(f.date)} · ${[f.venue, f.city].filter(Boolean).join(", ")}`}
      </p>
    </li>
  );
}

/** One trophy: its picture (if there is a free one), how many times United have won it, and every win. */
export default function TrophyCard({ trophy, wins }: { trophy: Trophy; wins: Win[] }) {
  const photo = trophyPhoto(trophy.key);
  const outright = wins.filter((w) => !w.shared).length;
  const shared = wins.length - outright;
  return (
    <li className="flex flex-col border border-white/15 bg-[#0c0c0c]">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-white/10 bg-black">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.src} alt={photo.shows} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center font-mono text-[11px] uppercase tracking-widest text-white/35">No free photo of this trophy</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-display text-xl uppercase tracking-wide text-white">{trophy.name}</h4>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-4xl leading-none text-united-gold">{wins.length}</span>
          <span className="text-sm text-white/65">
            {wins.length === 1 ? "win" : "wins"}
            {shared ? ` (${outright} outright, ${shared} shared)` : ""}
          </span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{wins.map((w) => w.label).join(", ")}</p>

        <details className="group mt-3 border-t border-white/10 pt-2">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-mono text-[11px] uppercase tracking-widest text-united-red [&::-webkit-details-marker]:hidden">
            Every win
            <span aria-hidden="true" className="transition-transform group-open:rotate-90">
              ›
            </span>
          </summary>
          <ul className="mt-1 divide-y divide-white/5">
            {[...wins].reverse().map((w) => (
              <WinRow key={w.season + w.label} w={w} />
            ))}
          </ul>
        </details>

        {photo ? (
          <p className="mt-auto pt-3 text-[10px] leading-snug text-white/35">
            Photo: {photo.author},{" "}
            <a href={photo.licenceUrl || photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              {photo.licence}
            </a>
            ,{" "}
            <a href={photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              Wikimedia Commons
            </a>
            . {photo.shows}.
          </p>
        ) : null}
      </div>
    </li>
  );
}
