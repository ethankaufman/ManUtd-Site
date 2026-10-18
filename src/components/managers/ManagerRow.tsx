"use client";

import { useEffect, useRef } from "react";

import { managerPhoto, STATUS_LABEL, when, type Manager } from "@/lib/managers";

const pct = (n: number | null) => (n === null ? "–" : `${n.toFixed(1)}%`);
const years = (m: Manager) => {
  const a = m.from.slice(0, 4);
  const b = m.to === "present" ? "present" : m.to.slice(0, 4);
  return a === b ? a : `${a}–${b}`;
};

function Chip({ status }: { status: Manager["status"] }) {
  const permanent = ["manager", "secretary-manager", "player-manager"].includes(status);
  return (
    <span className={`flex-none border px-1.5 py-px font-mono text-[10px] uppercase tracking-widest ${permanent ? "border-white/30 text-white/70" : "border-united-red/60 text-united-red"}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function Num({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-3 py-2 text-center">
      <div className="font-display text-xl text-white">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">{label}</div>
    </div>
  );
}

/** Honours grouped by trophy: "FA Cup ×5: 1989–90, 1993–94 ...". A * marks a shared Charity Shield. */
function Trophies({ m }: { m: Manager }) {
  const groups: { trophy: string; items: { label: string; shared: boolean }[] }[] = [];
  for (const h of m.honours) {
    let g = groups.find((x) => x.trophy === h.trophy);
    if (!g) groups.push((g = { trophy: h.trophy, items: [] }));
    g.items.push({ label: h.label, shared: h.shared });
  }
  if (!groups.length) return <p className="text-sm text-white/55">No trophies as manager.</p>;
  return (
    <ul className="space-y-1.5 text-sm text-white/80">
      {groups.map((g) => (
        <li key={g.trophy}>
          <span className="font-bold text-white">{g.trophy}</span> <span className="text-united-gold">×{g.items.length}</span>
          <span className="text-white/55"> · {g.items.map((i) => `${i.label}${i.shared ? "*" : ""}`).join(", ")}</span>
        </li>
      ))}
    </ul>
  );
}

/** One manager: a collapsed line (name, years, record) that opens to the photo, the story, each spell and the trophies. */
export default function ManagerRow({ m }: { m: Manager }) {
  // /managers/#alex-ferguson (from the site search) opens this row and scrolls to it
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const openFromAddress = () => {
      if (window.location.hash.slice(1) !== m.slug || !ref.current) return;
      ref.current.open = true;
      ref.current.scrollIntoView({ block: "start" });
    };
    const t = window.setTimeout(openFromAddress, 100);
    window.addEventListener("hashchange", openFromAddress);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", openFromAddress);
    };
  }, [m.slug]);
  const photo = managerPhoto(m.slug);
  const t = m.totals;
  const hasShared = m.honours.some((h) => h.shared);
  return (
    <li className="border-b border-white/10 last:border-b-0">
      <details ref={ref} className="group scroll-mt-20">
        <summary className="flex cursor-pointer list-none items-center gap-3 py-3 pr-1 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
          <span className="relative block h-12 w-12 flex-none overflow-hidden border border-white/10 bg-black">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.src} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-lg text-white/25" aria-hidden="true">
                {m.name.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-display text-lg uppercase tracking-wide text-white sm:text-xl">{m.name}</span>
              <Chip status={m.status} />
              {m.current ? <span className="flex-none bg-united-red px-1.5 py-px font-mono text-[10px] uppercase tracking-widest text-white">Now</span> : null}
            </span>
            <span className="block font-mono text-[11px] uppercase tracking-wider text-white/50">{years(m)}</span>
          </span>
          <span className="hidden flex-none text-right sm:block">
            <span className="block font-display text-xl text-white">{t.m.toLocaleString("en-GB")}</span>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-white/45">matches</span>
          </span>
          <span className="w-16 flex-none text-right">
            <span className="block font-display text-xl text-united-gold">{pct(m.winPct)}</span>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-white/45">wins</span>
          </span>
          <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
            ›
          </span>
        </summary>

        <div className="grid gap-6 border-t border-white/10 bg-white/[0.02] px-3 py-5 sm:grid-cols-[11rem_1fr] sm:px-5">
          <div className="w-44 max-w-full sm:w-auto">
            {photo ? (
              <figure>
                <div className="aspect-[3/4] overflow-hidden border border-white/15 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.src} alt={photo.shows} loading="lazy" className="h-full w-full object-cover object-top" />
                </div>
                <figcaption className="mt-1.5 text-[10px] leading-snug text-white/40">
                  {photo.shows}. Photo: {photo.author},{" "}
                  <a href={photo.licenceUrl || photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                    {photo.licence}
                  </a>
                  ,{" "}
                  <a href={photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                    Wikimedia Commons
                  </a>
                </figcaption>
              </figure>
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center border border-white/10 bg-black px-3 text-center font-mono text-[10px] uppercase tracking-widest text-white/30">No free photo</div>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            {m.story ? <p className="max-w-3xl text-base leading-relaxed text-white/85">{m.story}</p> : null}

            <div className="grid grid-cols-3 divide-x divide-white/10 border border-white/10 sm:grid-cols-6">
              <Num label="Matches" value={t.m.toLocaleString("en-GB")} />
              <Num label="Won" value={t.w.toLocaleString("en-GB")} />
              <Num label="Drawn" value={t.d} />
              <Num label="Lost" value={t.l} />
              <Num label="Goals" value={`${t.gf}–${t.ga}`} />
              <Num label="Win rate" value={pct(m.winPct)} />
            </div>

            {m.stints.length > 1 || m.stints.some((s) => s.role) ? (
              <div>
                <h4 className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-united-red">{m.stints.length > 1 ? "Each spell" : "Role"}</h4>
                <ul className="space-y-1 text-sm text-white/75">
                  {m.stints.map((s) => (
                    <li key={s.from}>
                      <span className="font-mono text-xs text-white/55">
                        {when(s.from)} to {when(s.to)}
                      </span>
                      {s.role ? <span className="ml-2 text-united-red">{s.role}</span> : null}
                      <span className="ml-2">
                        {s.m} matches: won {s.w}, drew {s.d}, lost {s.l}
                      </span>
                      {s.note ? <span className="block text-xs text-white/50">{s.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="font-mono text-xs text-white/50">
                {when(m.from)} to {when(m.to)}
              </p>
            )}

            <div>
              <h4 className="mb-1 font-mono text-[11px] uppercase tracking-[0.25em] text-united-red">Trophies</h4>
              <Trophies m={m} />
              {hasShared ? <p className="mt-1 text-xs text-white/40">* shared Charity Shield</p> : null}
            </div>
            {m.country ? <p className="text-xs text-white/40">Nationality: {m.country} (the country he played for, or else where he was born).</p> : null}
          </div>
        </div>
      </details>
    </li>
  );
}
