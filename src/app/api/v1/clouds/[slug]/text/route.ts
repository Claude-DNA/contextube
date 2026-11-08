import { handle, error } from "@/lib/http";
import { getCloud, cloudAsText } from "@/lib/clouds";

/** GET /api/v1/clouds/{slug}/text — the cloud as one plain-text (Markdown) document for an AI's context. */
export const GET = handle(async (_req, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const cloud = await getCloud(slug);
  if (!cloud) return error(404, "not_found", `No cloud with slug "${slug}".`);
  return new Response(cloudAsText(cloud), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
});
