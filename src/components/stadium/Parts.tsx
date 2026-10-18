import type { Entry, Source } from "@/lib/stadium";

export function Heading({ children }: { children: string }) {
  return <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-united-red">{children}</h3>;
}

/** Label/value pairs in a grid of small boxes. */
export function GlanceGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="bg-[#0c0c0c] p-4">
          <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{k}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-white/85">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A list of dated entries, each a collapsed row that opens to its text. */
export function EntryList({ entries, render }: { entries: (Entry & { status?: string })[]; render?: (e: Entry & { status?: string }) => React.ReactNode }) {
  return (
    <ol className="border-y border-white/15">
      {entries.map((e) => (
        <li key={e.when} className="border-b border-white/10 last:border-b-0">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-baseline gap-4 py-3 pr-1 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
              <span className="w-36 flex-none font-mono text-[11px] uppercase tracking-wider text-united-red sm:w-44">{e.when}</span>
              <span className="min-w-0 flex-1 text-sm leading-snug text-white/80 sm:text-base">{e.text.split(/(?<=[.;])\s/)[0]}</span>
              <span aria-hidden="true" className="w-4 flex-none text-center text-white/50 transition-transform group-open:rotate-90">
                ›
              </span>
            </summary>
            <div className="border-t border-white/10 bg-white/[0.02] px-3 py-4 sm:px-5">{render ? render(e) : <p className="max-w-3xl text-base leading-relaxed text-white/85">{e.text}</p>}</div>
          </details>
        </li>
      ))}
    </ol>
  );
}

export function Sources({ items, note }: { items: Source[]; note?: string }) {
  return (
    <section aria-label="Sources" className="mt-10 border-t border-white/10 pt-5">
      <Heading>Sources</Heading>
      <ul className="space-y-1 text-sm text-white/60">
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-3 text-xs leading-relaxed text-white/45">{note}</p> : null}
    </section>
  );
}
