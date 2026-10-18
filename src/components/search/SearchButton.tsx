"use client";

import { useEffect, useRef, useState } from "react";

import SearchDialog from "./SearchDialog";

/** The magnifying-glass button in the menu bar, plus the "/" shortcut. Owns whether the search window is open. */
export default function SearchButton() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || (el as HTMLElement).isContentEditable)) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        aria-haspopup="dialog"
        className="flex items-center gap-2 border border-white/40 px-3 py-1 font-mono text-xs uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black"
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M13 13l5 5" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
      </button>
      {open ? (
        <SearchDialog
          onClose={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
        />
      ) : null}
    </>
  );
}
