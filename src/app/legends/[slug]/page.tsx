import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Horns } from "@/components/DevilIcons";
import LegendView from "@/components/legends/LegendView";
import { legendBySlug, LEGENDS } from "@/lib/legends";

// The site is plain files, so every legend page is made at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return LEGENDS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata(props: PageProps<"/legends/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const l = legendBySlug(slug);
  return { title: l ? l.name : "Legend" };
}

export default async function Page(props: PageProps<"/legends/[slug]">) {
  const { slug } = await props.params;
  const l = legendBySlug(slug);
  if (!l) notFound();
  return (
    <main className="floodlight min-h-screen px-0 pt-28 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-10">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-white/60">
          <Horns className="h-3.5 w-auto" /> Legend
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.6rem,9vw,5.5rem)] uppercase leading-[0.95] text-white">{l.name}</h1>
        <div className="mt-5 h-px w-16 bg-united-red" aria-hidden="true" />
      </div>
      <LegendView l={l} />
    </main>
  );
}
