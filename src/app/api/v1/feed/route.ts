import { handle, json, intParam } from "@/lib/http";
import { getFeed } from "@/lib/content";
import { firstImage } from "@/lib/images";

export const GET = handle(async (req) => {
  const p = req.nextUrl.searchParams;
  const cards = await getFeed(intParam(p.get("limit"), 30), intParam(p.get("offset"), 0));
  // `essences` keeps the February response shape; `cards` is the flat v1 shape.
  const essences = cards.map((c) => ({
    id: c.id,
    layer: c.layer,
    extract: c.extract,
    text: c.text,
    sourceQuote: c.source_quote,
    importance: c.importance,
    image: firstImage(c.images)?.url ?? null,
    content: { id: c.content_id, slug: c.content_slug, title: c.content_title },
  }));
  return json({ essences, cards });
});
