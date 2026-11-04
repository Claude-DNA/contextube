import { handle, json, intParam } from "@/lib/http";
import { getFeed } from "@/lib/content";

export const GET = handle(async (req) => {
  const p = req.nextUrl.searchParams;
  return json({ cards: await getFeed(intParam(p.get("limit"), 30), intParam(p.get("offset"), 0)) });
});
