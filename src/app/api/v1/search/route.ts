import { handle, json, error, intParam } from "@/lib/http";
import { searchContent } from "@/lib/content";

export const GET = handle(async (req) => {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return error(400, "missing_query", "Pass a search query as ?q=");
  const results = await searchContent(q, intParam(req.nextUrl.searchParams.get("limit"), 10));
  return json({ query: q, results });
});
