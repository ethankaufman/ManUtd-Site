"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** The old Overhead Kicks chapter now lives in Wayne Rooney's section of the Legends chapter: send people there. */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/legends/wayne-rooney");
  }, [router]);
  return (
    <main className="floodlight flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-3xl uppercase tracking-wide text-white">Moved</p>
      <p className="mt-3 max-w-md text-white/70">The overhead kick is now part of Wayne Rooney’s page in the Legends chapter.</p>
      <Link href="/legends/wayne-rooney" className="mt-6 border border-united-red bg-united-red px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-white hover:text-united-red">
        Go to Wayne Rooney →
      </Link>
    </main>
  );
}
