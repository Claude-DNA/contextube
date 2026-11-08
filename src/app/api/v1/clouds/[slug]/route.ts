import { revalidatePath } from "next/cache";
import { handle, json, error, authorizeWriter, siteUrl } from "@/lib/http";
import { getCloud, unpublishCloud } from "@/lib/clouds";

/** GET /api/v1/clouds/{slug} — the cloud with its elements grouped by kind. */
export const GET = handle(async (_req, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const cloud = await getCloud(slug);
  if (!cloud) return error(404, "not_found", `No cloud with slug "${slug}".`);
  return json({ cloud: { ...cloud, url: `${siteUrl()}/cloud/${cloud.slug}`, text_url: `${siteUrl()}/api/v1/clouds/${cloud.slug}/text` } });
});

/** DELETE /api/v1/clouds/{slug}?owner= — take a cloud down (its writer, or an editor). Publishing again restores it. */
export const DELETE = handle(async (req, ctx: { params: Promise<{ slug: string }> }) => {
  const writer = authorizeWriter(req);
  if (!writer) return error(401, "unauthorized", "Send Authorization: Bearer <publish key>.");
  const { slug } = await ctx.params;
  const r = await unpublishCloud(slug, writer, req.nextUrl.searchParams.get("owner") ?? undefined);
  if (r === "not_found") return error(404, "not_found", `No cloud with slug "${slug}".`);
  if (r === "forbidden") return error(403, "forbidden", "Only the cloud's publisher can take it down.");
  revalidatePath("/clouds");
  revalidatePath(`/cloud/${slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/sitemap.xml");
  return json({ unpublished: slug }, { cache: false });
}, { limit: false });
