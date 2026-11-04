import { z } from "zod";
import { handle, json, error } from "@/lib/http";
import { assemble } from "@/lib/assemble";
import { formatZodError } from "@/lib/validate";

const bodySchema = z.object({
  contentId: z.string().min(1),
  maxTokens: z.number().int().positive().optional(),
  maxLayer: z.number().int().min(1).max(5).optional(),
  strategy: z.enum(["relevant", "complete", "custom"]).optional(),
  // The shipped spec says array; the Architecture doc showed a string. Accept both.
  focus: z.union([z.array(z.string()), z.string()]).optional(),
  chunkIds: z.array(z.string()).optional(),
});

export const POST = handle(async (req) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(400, "bad_json", "Body must be JSON.");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return error(400, "invalid_request", "Request did not validate.", formatZodError(parsed.error));
  if (parsed.data.strategy === "custom" && !parsed.data.chunkIds?.length) {
    return error(400, "invalid_request", "strategy 'custom' needs chunkIds.");
  }
  const result = await assemble(parsed.data);
  if (!result) return error(404, "not_found", `No published content with id or slug "${parsed.data.contentId}".`);
  return json(result, { cache: false });
});
