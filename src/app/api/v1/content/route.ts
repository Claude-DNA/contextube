import { handle, json, intParam } from "@/lib/http";
import { listContent } from "@/lib/content";

export const GET = handle(async (req) => {
  const p = req.nextUrl.searchParams;
  const result = await listContent({
    flow: p.get("flow") ?? undefined,
    tag: p.get("tag") ?? undefined,
    domain: p.get("domain") ?? undefined,
    language: p.get("language") ?? undefined,
    limit: intParam(p.get("limit"), 20),
    offset: intParam(p.get("offset"), 0),
  });
  return json(result);
});
