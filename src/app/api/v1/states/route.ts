import { handle, json, intParam } from "@/lib/http";
import { findStates, STATE_WORKS } from "@/lib/states";

/**
 * GET /api/v1/states — the state library: characters from literature at one moment, as formulas of feeling.
 * ?character=alyosha  ?work=the-brothers-karamazov  ?state=grief (a vocabulary id in the formula)
 * ?q=mentor death (words that must all appear)  ?limit=50&offset=0 (limit up to 1000)
 */
export const GET = handle(async (req) => {
  const p = req.nextUrl.searchParams;
  const found = findStates({ character: p.get("character") ?? undefined, work: p.get("work") ?? undefined, state: p.get("state") ?? undefined, q: p.get("q") ?? undefined });
  const limit = Math.min(Math.max(intParam(p.get("limit"), 50), 1), 1000);
  const offset = Math.max(intParam(p.get("offset"), 0), 0);
  return json({
    total: found.length,
    works: STATE_WORKS.map((w) => ({ slug: w.slug, title: w.title, author: w.author, source: w.source, source_url: w.source_url, states: w.states.length })),
    states: found.slice(offset, offset + limit),
  });
});
