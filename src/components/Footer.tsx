import Link from "next/link";

import { Pitchfork } from "./DevilIcons";

export default function Footer() {
  return (
    <footer className="border-t border-white/15 bg-black px-6 py-10 text-center text-sm text-white/60">
      <Pitchfork className="mx-auto mb-4 h-12 w-auto" />
      <p className="font-display text-xl uppercase tracking-wide text-white">
        Manchester <span className="text-united-red">United</span> · The Red Devils
      </p>
      <p className="mx-auto mt-3 max-w-2xl">
        An unofficial fan-made site. It is not affiliated with, or endorsed by, Manchester United Football Club.
        Club names and marks belong to their owners.
      </p>
      <p className="mt-3">
        <Link href="/#chapters" className="underline underline-offset-4 hover:text-white">
          All chapters
        </Link>
        {" · "}
        <Link href="/on-this-day/" className="underline underline-offset-4 hover:text-white">
          On this day
        </Link>
        {" · "}
        <Link href="/head-to-head/" className="underline underline-offset-4 hover:text-white">
          Head to head
        </Link>
      </p>
    </footer>
  );
}
