"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CHAPTERS } from "@/lib/chapters";
import SearchButton from "./search/SearchButton";

/**
 * The menu bar across the top. On the home page it stays out of the way during the zoom intro and
 * slides in once you have scrolled to the end of it; on every other page it is always there.
 * On narrow screens the chapters live behind a menu button.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [pastIntro, setPastIntro] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const check = () => {
      const intro = document.querySelector("section[aria-label^='Introduction']");
      const end = intro ? intro.getBoundingClientRect().height - window.innerHeight : 0;
      setPastIntro(window.scrollY > end * 0.9);
    };
    const first = window.setTimeout(check, 0);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [isHome]);

  const visible = !isHome || pastIntro;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-black/90 text-white backdrop-blur transition-transform duration-300 ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4" aria-label="Main">
        <Link href="/" className="font-display text-xl uppercase leading-none tracking-wide" onClick={() => setOpen(false)}>
          Manchester <span className="text-united-red">United</span>
        </Link>

        <ul className="hidden items-center gap-1 xl:flex">
          {CHAPTERS.map((c) => {
            const active = pathname === `/${c.slug}` || pathname === `/${c.slug}/`;
            return (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition ${
                    active ? "border-united-red text-white" : c.featured ? "border-transparent text-united-red hover:border-united-red" : "border-transparent text-white/70 hover:text-white"
                  }`}
                >
                  {c.menu}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <SearchButton />
          <button
            type="button"
            className="border border-white/40 px-3 py-1 font-mono text-xs uppercase tracking-widest xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close ✕" : "Menu ☰"}
          </button>
        </div>
      </nav>

      {open ? (
        <ul id="mobile-menu" className="border-t border-white/15 bg-black xl:hidden">
          {CHAPTERS.map((c) => (
            <li key={c.slug} className="border-b border-white/10 last:border-b-0">
              <Link
                href={`/${c.slug}`}
                onClick={() => setOpen(false)}
                className={`block px-5 py-3 font-mono text-sm uppercase tracking-widest ${c.featured ? "text-united-red" : "text-white/85 hover:text-united-red"}`}
              >
                <span className="mr-3 text-white/35">{c.number}</span>
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
