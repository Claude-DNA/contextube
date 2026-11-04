import { handle, json, error } from "@/lib/http";
import { getLayer } from "@/lib/content";
import { layerName } from "@/lib/layers";

export const GET = handle(async (_req, ctx: { params: Promise<{ id: string; layer: string }> }) => {
  const { id, layer } = await ctx.params;
  const n = Number(layer);
  if (!Number.isInteger(n) || n < 1 || n > 5) return error(400, "bad_layer", "layer must be 1 to 5.");
  const result = await getLayer(id, n);
  if (!result) return error(404, "not_found", `No published content with id or slug "${id}".`);
  return json({ ...result, layer_name: layerName(n) });
});
