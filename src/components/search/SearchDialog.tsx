"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { prepare, search, type Prepared } from "@/lib/search";
import type { SearchEntry } from "@/lib/searchindex";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TRY = ["Rooney", "Liverpool", "Treble", "2008–09", "Old Trafford", "6 February"];

let cache: Promise<Prepared[]> | null = null;
const load = () =>
  (cache ??= fetch(`${BASE}/search-index.json`).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json().then((d: SearchEntry[]) => prepare(d));
  }));

/** The search window: type, see matches from every chapter, arrow keys + Enter (or tap) to go there, Esc to close. */
export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<Prepared[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    input.current?.focus();
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : "";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = "";
    };
  }, []);

  useEffect(() => {
    let live = true;
    load().then(
      (d) => live && setEntries(d),
      () => {
        cache = null;
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  const results = useMemo(() => (entries ? search(entries, query) : []), [entries, query]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  function go(e: SearchEntry) {
    onClose();
    router.push(e.u);
    // a link to another tab of the page you are already on only changes the #address: tell the page
    if (e.u.includes("#")) window.setTimeout(() => window.dispatchEvent(new Event("hashchange")), 60);
  }

  function onKeyDown(ev: React.KeyboardEvent) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      onClose();
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setActive(Math.min(current + 1, results.length - 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setActive(Math.max(current - 1, 0));
    } else if (ev.key === "Enter" && results[current]) {
      ev.preventDefault();
      go(results[current]);
    } else if (ev.key === "Tab") {
      // keep focus inside the window: the only controls are the box and the close button
      const els = Array.from(document.querySelectorAll<HTMLElement>("#search-dialog input, #search-dialog button"));
      const first = els[0];
      const last = els[els.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  }

  useEffect(() => {
    document.getElementById(`search-result-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 px-3 pt-16 backdrop-blur-sm sm:pt-24" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div id="search-dialog" role="dialog" aria-modal="true" aria-label="Search the site" onKeyDown={onKeyDown} className="w-full max-w-xl border border-white/25 bg-[#0c0c0c] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/15 px-4 py-3">
          <svg viewBox="0 0 20 20" className="h-4 w-4 flex-none text-white/60" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l5 5" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results.length ? `search-result-${current}` : undefined}
            aria-label="Search players, legends, seasons, clubs and more"
            placeholder="Search players, clubs, seasons, history…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
          />
          <button type="button" onClick={onClose} className="flex-none border border-white/30 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:border-white hover:text-white">
            Esc
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto" aria-live="polite">
          {failed ? (
            <p className="px-4 py-6 text-sm text-white/60">Search could not be loaded. Please try again later.</p>
          ) : !entries ? (
            <p className="px-4 py-6 text-sm text-white/45">Loading…</p>
          ) : !query.trim() ? (
            <div className="px-4 py-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/45">Try</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRY.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setQuery(t);
                      input.current?.focus();
                    }}
                    className="border border-white/25 px-3 py-1.5 text-sm text-white/80 transition hover:border-white hover:text-white"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-white/60">Nothing found for “{query.trim()}”. Try a surname, a club or a season such as 1998–99.</p>
          ) : (
            <ul id="search-results" role="listbox" aria-label="Results">
              {results.map((r, i) => (
                <li key={`${r.k}-${r.u}-${r.t}`} id={`search-result-${i}`} role="option" aria-selected={i === current}>
                  <Link
                    href={r.u}
                    onClick={(ev) => {
                      ev.preventDefault();
                      go(r);
                    }}
                    onMouseMove={() => i !== current && setActive(i)}
                    tabIndex={-1}
                    className={`flex items-start gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 ${i === current ? "bg-united-red/20" : ""}`}
                  >
                    <span className="mt-0.5 w-24 flex-none font-mono text-[10px] uppercase tracking-widest text-united-red">{r.k}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-display text-lg uppercase leading-tight tracking-wide text-white">{r.t}</span>
                      {r.s ? <span className="mt-0.5 block break-words text-xs leading-snug text-white/55">{r.s}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="hidden border-t border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/40 sm:block">↑ ↓ to move · Enter to open · Esc to close · press / anywhere to search</p>
      </div>
    </div>
  );
}
