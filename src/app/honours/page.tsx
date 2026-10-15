import type { Metadata } from "next";

import ChapterPage from "@/components/ChapterPage";
import { chapterBySlug } from "@/lib/chapters";

export const metadata: Metadata = { title: "Honours & Awards" };

export default function Page() {
  return <ChapterPage chapter={chapterBySlug("honours")} />;
}
