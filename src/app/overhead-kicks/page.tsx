import type { Metadata } from "next";

import ChapterPage from "@/components/ChapterPage";
import { chapterBySlug } from "@/lib/chapters";

export const metadata: Metadata = { title: "Overhead Kicks" };

export default function Page() {
  return <ChapterPage chapter={chapterBySlug("overhead-kicks")} />;
}
