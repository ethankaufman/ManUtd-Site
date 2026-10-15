import { getTagline } from "@/lib/data";

export default async function Home() {
  const tagline = await getTagline();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.4em] text-united-gold">Est. 1878</p>
      <h1 className="text-5xl font-black uppercase tracking-tight sm:text-7xl">
        Manchester <span className="text-united-red">United</span>
      </h1>
      <p className="max-w-xl text-lg text-white/70">{tagline}</p>
      <div className="h-1 w-24 bg-united-red" />
      <p className="text-sm text-white/40">The site is being built. Check back soon.</p>
    </main>
  );
}
