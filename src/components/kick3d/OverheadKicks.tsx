"use client";

import { useState } from "react";

import { KICKS } from "@/lib/kicks";
import KickViewer from "./KickViewer";

function Heading({ children }: { children: string }) {
  return <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-united-red">{children}</h3>;
}

/** The whole Overhead Kicks page body: pick a goal, explore it in 3D, read the distance and the match story. */
export default function OverheadKicks() {
  const [id, setId] = useState(KICKS[0].id);
  const kick = KICKS.find((k) => k.id === id) ?? KICKS[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 text-left">
      <div role="tablist" aria-label="Choose a goal" className="mb-6 flex flex-wrap justify-center gap-2">
        {KICKS.map((k) => (
          <button
            key={k.id}
            role="tab"
            type="button"
            aria-selected={k.id === id}
            onClick={() => setId(k.id)}
            className={`border px-4 py-2 font-mono text-xs uppercase tracking-widest transition ${
              k.id === id ? "border-united-red bg-united-red text-white" : "border-white/25 text-white/75 hover:border-white hover:text-white"
            }`}
          >
            {k.shortTitle}
          </button>
        ))}
      </div>

      <div className="mb-5 text-center">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white sm:text-5xl">{kick.title}</h2>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-white/60">
          {kick.date} · {kick.competition} · {kick.venue}
        </p>
        <p className="mt-3 font-display text-xl uppercase tracking-wide text-white sm:text-2xl">
          {kick.fixture} <span className="text-white/50">·</span> {kick.minute}
        </p>
      </div>

      <KickViewer kick={kick} />
      <p className="mt-3 text-center text-xs leading-relaxed text-white/45">
        A simplified reconstruction: the player is a stylised figure and the movement and ball path are illustrative, not tracking data. The facts, scores
        and distance below come from the sources listed.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section aria-label="Distance">
          <Heading>Distance from goal</Heading>
          <div className="border border-united-gold/60 bg-[#0c0c0c] p-5">
            <p className="font-display text-5xl leading-none text-united-gold">
              {kick.distance.estimate ? "≈ " : ""}
              {kick.distance.yards} <span className="text-2xl">yards</span>
            </p>
            <p className="mt-1 text-white/70">
              {kick.distance.estimate ? "about " : ""}
              {kick.distance.metres} metres from the goal line
            </p>
            <p className={`mt-3 inline-block border px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest ${kick.distance.estimate ? "border-white/40 text-white/80" : "border-united-gold/60 text-united-gold"}`}>
              {kick.distance.estimate ? "Our estimate" : "Reported figure"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">{kick.distance.note}</p>
          </div>
          <div className="mt-6">
            <Heading>The goals</Heading>
            <p className="text-sm leading-relaxed text-white/70">{kick.scorers}</p>
          </div>
        </section>

        <section aria-label="Match summary">
          <Heading>Match summary</Heading>
          <div className="space-y-3 text-base leading-relaxed text-white/80">
            {kick.summary.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-6">
            <Heading>About the goal</Heading>
            <ul className="space-y-2 text-sm leading-relaxed text-white/75">
              {kick.facts.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-none bg-united-red" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section aria-label="Sources" className="mt-10 border-t border-white/10 pt-6">
        <Heading>Sources</Heading>
        <ul className="space-y-1 text-sm text-white/60">
          {kick.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
