import { revalidatePath } from "next/cache";
import { handle, json, error, authorizeWriter } from "@/lib/http";
import { unpublishContent } from "@/lib/content";

/** Unpublishes a unit. Nothing is hard-deleted; publishing it again restores it. */
export const DELETE = handle(async (req, ctx: { params: Promise<{ slug: string }> }) => {
  if (!authorizeWriter(req)) return error(401, "unauthorized", "Send Authorization: Bearer <publish key>.");
  const { slug } = await ctx.params;
  const done = await unpublishContent(slug);
  if (!done) return error(404, "not_found", `No content with slug "${slug}".`);
  revalidatePath("/");
  revalidatePath(`/content/${slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/sitemap.xml");
  return json({ unpublished: slug }, { cache: false });
}, { limit: false });
