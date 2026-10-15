import Link from "next/link";

import { CHAPTERS } from "@/lib/chapters";
import { Horns, PitchforkDivider } from "./DevilIcons";

/** The home page's list of chapters: big comic panels, one under the other, down the middle of the page. */
export default function Chapters() {
  return (
    <section id="chapters" className="relative overflow-hidden bg-black px-5 pb-28 pt-24">
      {/* a strip of red halftone dots along the top edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-70"
        style={{
          backgroundImage: "radial-gradient(#DA291C 2px, transparent 2.4px)",
          backgroundSize: "14px 14px",
          maskImage: "linear-gradient(to bottom, #000, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)",
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="flex items-center gap-2 border-[3px] border-black bg-united-gold px-3 py-1 font-caption text-sm font-bold uppercase tracking-widest text-black shadow-[4px_4px_0_#000]">
          <Horns className="h-4 w-auto" /> The Red Devils
        </div>
        <h2 className="mt-5 font-display text-[clamp(2.4rem,9vw,5.5rem)] uppercase leading-[0.95] text-white" style={{ textShadow: "5px 5px 0 #DA291C" }}>
          Choose your chapter
        </h2>
        <p className="mt-4 max-w-xl text-lg text-white/75">Everything about Manchester United, one chapter at a time.</p>
        <PitchforkDivider className="mt-10 w-full" />
      </div>

      <ol className="relative mx-auto mt-14 flex max-w-3xl flex-col gap-14">
        {CHAPTERS.map((c, i) => (
          <li key={c.slug}>
            <Link
              href={`/${c.slug}`}
              className={`group relative block border-4 border-black p-6 text-left shadow-[10px_10px_0_#DA291C] transition duration-200 hover:-translate-y-1 hover:shadow-[14px_14px_0_#FBE122] sm:p-8 ${
                c.featured ? "bg-united-red text-white" : "bg-white text-black"
              } ${i % 2 ? "rotate-[0.7deg]" : "-rotate-[0.7deg]"}`}
            >
              <div className="flex items-start gap-5">
                <span
                  className={`font-display text-6xl leading-none sm:text-7xl ${c.featured ? "text-black" : "text-united-red"}`}
                  style={c.featured ? { textShadow: "3px 3px 0 #fff" } : { textShadow: "3px 3px 0 #000" }}
                  aria-hidden="true"
                >
                  {c.number}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-3xl uppercase leading-none sm:text-4xl">{c.title}</h3>
                  <p className="mt-3 font-caption text-base leading-snug sm:text-lg">{c.teaser}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 font-caption text-sm font-bold uppercase">
                    {c.status === "soon" ? (
                      <span className="border-[3px] border-black bg-united-gold px-2.5 py-0.5 text-black">Coming soon</span>
                    ) : null}
                    <span className="underline decoration-[3px] underline-offset-4 transition group-hover:translate-x-1">Open chapter ▸</span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
