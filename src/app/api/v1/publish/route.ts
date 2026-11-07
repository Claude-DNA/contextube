import { revalidatePath } from "next/cache";
import { handle, json, error, authorizeWriter, siteUrl } from "@/lib/http";
import { publishContent, SlugTakenError } from "@/lib/content";
import { publishSchema, formatZodError } from "@/lib/validate";

export const maxDuration = 60;

export const POST = handle(async (req) => {
  const writer = authorizeWriter(req);
  if (!writer) return error(401, "unauthorized", "Send Authorization: Bearer <publish key>.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(400, "bad_json", "Body must be JSON.");
  }
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    // The whole unit is rejected; nothing is written.
    return error(422, "invalid_content", "Content did not validate.", formatZodError(parsed.error));
  }

  let r;
  try {
    r = await publishContent(parsed.data, writer);
  } catch (e) {
    if (e instanceof SlugTakenError) {
      return error(409, "slug_taken", `${e.message} Choose another title or send a different slug.`);
    }
    throw e;
  }
  // Readers see the new work at once instead of after the 5-minute cache.
  revalidatePath("/");
  revalidatePath(`/content/${r.slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/sitemap.xml");
  if (parsed.data.flow) revalidatePath(`/flow/${parsed.data.flow}`);
  return json(
    {
      content: { id: r.id, slug: r.slug, url: `${siteUrl()}/content/${r.slug}` },
      created: r.created,
      chunk_count: r.chunk_count,
      total_tokens: r.total_tokens,
    },
    { status: r.created ? 201 : 200, cache: false },
  );
}, { limit: false });
