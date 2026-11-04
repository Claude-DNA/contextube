import { handle, json, error } from "@/lib/http";
import { getContent } from "@/lib/content";

export const GET = handle(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const unit = await getContent(id);
  if (!unit) return error(404, "not_found", `No published content with id or slug "${id}".`);
  return json({ content: unit });
});
