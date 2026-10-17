import type { Metadata } from "next";

import MatchesShell from "@/components/matches/MatchesShell";
import { getMatchSeasons } from "@/lib/data";

export const metadata: Metadata = { title: "Every Match" };

/** /matches opens on the newest season. */
export default async function Page() {
  const [latest] = await getMatchSeasons();
  return <MatchesShell season={latest} />;
}
