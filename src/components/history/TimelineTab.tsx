import { TIMELINE } from "@/lib/club";

/** The key moments, each one a collapsed row that opens to the full sentence and where it comes from. */
export default function TimelineTab() {
  return (
    <div>
      <p className="mb-4 text-sm text-white/60">{TIMELINE.length} moments from 1878 to today. Click one to read it.</p>
      <ol className="border-y border-white/15">
        {TIMELINE.map((e) => (
          <li key={e.when + e.title} className="border-b border-white/10 last:border-b-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-baseline gap-4 py-3 pr-1 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="w-32 flex-none font-mono text-[11px] uppercase tracking-wider text-united-red sm:w-40">{e.when}</span>
                <span className="min-w-0 flex-1 font-display text-lg uppercase tracking-wide text-white sm:text-xl">{e.title}</span>
                <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <div className="space-y-3 border-t border-white/10 bg-white/[0.02] px-3 py-5 sm:px-5">
                <p className="max-w-3xl text-base leading-relaxed text-white/85">{e.text}</p>
                <p className="text-xs text-white/45">
                  {e.sources.map((s, i) => (
                    <span key={s}>
                      {i ? " · " : "Source: "}
                      <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                        Wikipedia
                      </a>
                    </span>
                  ))}
                  {e.from_data.length ? (
                    <span>
                      {e.sources.length ? " · " : ""}
                      {e.from_data.join(" · ")}
                    </span>
                  ) : null}
                </p>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
