import type { Metadata } from "next";

import MatchesShell from "@/components/matches/MatchesShell";
import { getMatchSeasons } from "@/lib/data";
import { seasonLabel } from "@/lib/format";

// only the seasons we hold are built; anything else is a 404
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getMatchSeasons()).map((season) => ({ season }));
}

export async function generateMetadata(props: PageProps<"/matches/[season]">): Promise<Metadata> {
  const { season } = await props.params;
  return { title: `Every Match · ${seasonLabel(season)}` };
}

export default async function Page(props: PageProps<"/matches/[season]">) {
  const { season } = await props.params;
  return <MatchesShell season={season} />;
}
