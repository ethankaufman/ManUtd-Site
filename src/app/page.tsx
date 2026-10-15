import Intro from "@/components/intro/Intro";
import { getTagline } from "@/lib/data";

export default async function Home() {
  const tagline = await getTagline();

  return (
    <>
      <Intro />
      {/* placeholder for the next sections (current season, history, honours...) */}
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-united-gold">Est. 1878</p>
        <p className="max-w-xl font-[family-name:var(--font-anton)] text-4xl uppercase text-white sm:text-6xl">{tagline}</p>
        <div className="h-1 w-24 bg-united-red" />
        <p className="text-sm text-white/40">More chapters coming soon.</p>
      </main>
    </>
  );
}
