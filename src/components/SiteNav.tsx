"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CHAPTERS } from "@/lib/chapters";

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
      className={`fixed inset-x-0 top-0 z-50 border-b-4 border-united-red bg-black text-white transition-transform duration-300 ${visible ? "translate-y-0" : "-translate-y-full"}`}
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
                  className={`px-3 py-1.5 font-caption text-sm font-bold uppercase tracking-wide transition ${
                    c.featured ? "bg-united-red text-white hover:bg-white hover:text-black" : active ? "bg-white text-black" : "text-white/85 hover:bg-united-red hover:text-white"
                  } ${c.featured && active ? "outline outline-[3px] outline-white" : ""}`}
                >
                  {c.menu}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="border-[3px] border-white px-3 py-1 font-caption text-sm font-bold uppercase xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close ✕" : "Menu ☰"}
        </button>
      </nav>

      {open ? (
        <ul id="mobile-menu" className="border-t-4 border-united-red bg-black xl:hidden">
          {CHAPTERS.map((c) => (
            <li key={c.slug} className="border-b-2 border-white/15 last:border-b-0">
              <Link
                href={`/${c.slug}`}
                onClick={() => setOpen(false)}
                className={`block px-5 py-3 font-caption text-base font-bold uppercase ${c.featured ? "bg-united-red text-white" : "text-white hover:bg-united-red"}`}
              >
                <span className="mr-3 text-white/40">{c.number}</span>
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
