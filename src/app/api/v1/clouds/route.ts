import { revalidatePath } from "next/cache";
import { handle, json, error, authorizeWriter, intParam, siteUrl } from "@/lib/http";
import { listClouds, publishCloud } from "@/lib/clouds";
import { SlugTakenError } from "@/lib/content";
import { cloudSchema, formatZodError } from "@/lib/validate";

export const maxDuration = 60;

/** GET /api/v1/clouds?limit=&offset=&flow= — published clouds, newest first. */
export const GET = handle(async (req) => {
  const p = req.nextUrl.searchParams;
  const { clouds, total } = await listClouds({ limit: intParam(p.get("limit"), 50), offset: intParam(p.get("offset"), 0), flow: p.get("flow") ?? undefined });
  return json({ clouds: clouds.map((c) => ({ ...c, url: `${siteUrl()}/cloud/${c.slug}` })), total });
});

/** POST /api/v1/clouds — publish or replace a cloud (publish key required). */
export const POST = handle(async (req) => {
  const writer = authorizeWriter(req);
  if (!writer) return error(401, "unauthorized", "Send Authorization: Bearer <publish key>.");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(400, "bad_json", "Body must be JSON.");
  }
  const parsed = cloudSchema.safeParse(body);
  if (!parsed.success) return error(422, "invalid_cloud", "Cloud did not validate.", formatZodError(parsed.error));

  let r;
  try {
    r = await publishCloud(parsed.data, writer);
  } catch (e) {
    if (e instanceof SlugTakenError) return error(409, "slug_taken", `${e.message} Choose another title or send a different slug.`);
    throw e;
  }
  revalidatePath("/");
  revalidatePath("/clouds");
  revalidatePath(`/cloud/${r.slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/sitemap.xml");
  return json(
    { cloud: { id: r.id, slug: r.slug, url: `${siteUrl()}/cloud/${r.slug}` }, created: r.created, element_count: r.element_count },
    { status: r.created ? 201 : 200, cache: false },
  );
}, { limit: false });
