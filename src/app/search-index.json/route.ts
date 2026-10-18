import { buildSearchIndex } from "@/lib/searchindex";

// The whole site-search index as one static file, written at build time (see src/lib/searchindex.ts).
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await buildSearchIndex());
}
