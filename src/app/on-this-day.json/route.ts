import { buildDayIndex } from "@/lib/onthisday";

// The whole "On this day" index as one static file, written at build time. The browser fetches it and picks out today's date.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await buildDayIndex());
}
