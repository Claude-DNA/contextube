import { handle, json, error, intParam } from "@/lib/http";
import { getLayer } from "@/lib/content";
import { layerName } from "@/lib/layers";

/** ?q=words&limit=5 returns only the chunks of this layer that best match the words (any of them), in reading order. */
export const GET = handle(async (req, ctx: { params: Promise<{ id: string; layer: string }> }) => {
  const { id, layer } = await ctx.params;
  const n = Number(layer);
  if (!Number.isInteger(n) || n < 1 || n > 5) return error(400, "bad_layer", "layer must be 1 to 5.");
  const q = req.nextUrl.searchParams.get("q")?.trim() || undefined;
  const result = await getLayer(id, n, q, intParam(req.nextUrl.searchParams.get("limit"), 5));
  if (!result) return error(404, "not_found", `No published content with id or slug "${id}".`);
  return json({ ...result, layer_name: layerName(n), ...(q ? { query: q } : {}) });
});
