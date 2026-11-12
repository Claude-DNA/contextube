import { handle, error, siteUrl } from "@/lib/http";
import { getCloud } from "@/lib/clouds";
import { CLOUD_KINDS } from "@/lib/validate";
import type { Img } from "@/lib/images";

const img = (i: Img | null) => (i ? { image: { url: i.url, ...(i.alt ? { alt: i.alt } : {}), ...(i.credit ? { credit: i.credit } : {}) } } : {});

/**
 * GET /api/v1/clouds/{slug}/file — the whole cloud as one context-cloud file (.cloud.json):
 * { format: "context-cloud", version: 1, cloud: {...}, elements: [{ kind, title, text, image?, metadata? }] }.
 * The same file Context Cloud Studio saves and opens, so a cloud can be kept, shared and edited again.
 * ?download=0 returns plain JSON without the save-as header.
 */
export const GET = handle(async (req, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const c = await getCloud(slug);
  if (!c) return error(404, "not_found", `No cloud with slug "${slug}".`);
  const opt = (k: string, v: string | null) => (v ? { [k]: v } : {});
  const cover = img(c.cover).image;
  const file = {
    format: "context-cloud",
    version: 1,
    exported_at: new Date().toISOString(),
    generator: "ConteXtube",
    cloud: {
      title: c.title,
      ...opt("description", c.description), ...opt("genre", c.genre), ...opt("creator_name", c.creator_name),
      rights: c.rights,
      ...opt("source_title", c.source_title), ...opt("source_author", c.source_author), ...opt("purchase_url", c.purchase_url),
      slug: c.slug,
      url: `${siteUrl()}/cloud/${c.slug}`,
      ...(cover ? { cover } : {}),
    },
    elements: CLOUD_KINDS.flatMap((kind) =>
      c.elements[kind].map((e) => ({
        kind, title: e.title, text: e.text, ...img(e.image),
        ...(Object.keys(e.metadata ?? {}).length ? { metadata: e.metadata } : {}),
      }))
    ),
  };
  const download = new URL(req.url).searchParams.get("download") !== "0";
  return new Response(JSON.stringify(file, null, 2), {
    headers: {
      "Content-Type": `${download ? "application/vnd.context-cloud+json" : "application/json"}; charset=utf-8`,
      ...(download ? { "Content-Disposition": `attachment; filename="${c.slug}.cloud.json"` } : {}),
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
});
