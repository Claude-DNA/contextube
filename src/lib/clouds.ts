import { query, withTransaction } from "./db";
import { slugify } from "./slug";
import { toImage, type Img } from "./images";
import { isEditor, SlugTakenError } from "./content";
import { CLOUD_KINDS, type CloudInput, type CloudKind } from "./validate";
import { siteUrl } from "./http";

/**
 * Clouds: a work's story bible (plot beats, characters, places, world rules, ideas, references),
 * published from Context Cloud Studio and shown at /cloud/<slug>. Readers browse it; agents read it
 * as JSON or as one plain-text document ("Copy for AI").
 */

export type CloudSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  genre: string | null;
  creator_name: string | null;
  flow_slug: string | null;
  work_slug: string | null;
  rights: "own" | "public_domain" | "copyrighted";
  source_title: string | null;
  source_author: string | null;
  purchase_url: string | null;
  cover: Img | null;
  element_count: number;
  created_at: string;
  updated_at: string;
};

export type CloudElement = {
  id: string;
  kind: CloudKind;
  position: number;
  title: string;
  text: string;
  image: Img | null;
  metadata: Record<string, unknown>;
};

export type Cloud = CloudSummary & { elements: Record<CloudKind, CloudElement[]> };

export const KIND_LABELS: Record<CloudKind, string> = {
  plot: "Plot",
  characters: "Characters",
  stage: "Stage",
  universe: "Universe",
  ideas: "Ideas",
  references: "References",
};

const SUMMARY_COLUMNS = `
  c.id, c.slug, c.title, c.description, c.genre, c.creator_name, f.slug AS flow_slug, c.work_slug,
  c.rights, c.source_title, c.source_author, c.purchase_url, c.cover, c.element_count, c.created_at, c.updated_at`;

function summary(row: Record<string, unknown>): CloudSummary {
  return { ...(row as unknown as CloudSummary), cover: toImage(row.cover) };
}

export async function listClouds(opts: { limit?: number; offset?: number; flow?: string } = {}): Promise<{ clouds: CloudSummary[]; total: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);
  const where = [`c.status = 'published'`];
  const params: unknown[] = [];
  if (opts.flow) {
    params.push(opts.flow);
    where.push(`f.slug = $${params.length}`);
  }
  const base = `FROM clouds c LEFT JOIN flows f ON f.id = c.flow_id WHERE ${where.join(" AND ")}`;
  const [rows, count] = await Promise.all([
    query(`SELECT ${SUMMARY_COLUMNS} ${base} ORDER BY c.updated_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
    query<{ n: string }>(`SELECT count(*) AS n ${base}`, params),
  ]);
  return { clouds: rows.rows.map(summary), total: Number(count.rows[0]?.n ?? 0) };
}

export async function getCloud(slug: string): Promise<Cloud | null> {
  const r = await query(`SELECT ${SUMMARY_COLUMNS} FROM clouds c LEFT JOIN flows f ON f.id = c.flow_id WHERE c.slug = $1 AND c.status = 'published'`, [slug]);
  if (!r.rows.length) return null;
  const head = summary(r.rows[0]);
  const els = await query(
    `SELECT id, kind, position, title, text, image, metadata FROM cloud_elements WHERE cloud_id = $1 ORDER BY kind, position`,
    [head.id],
  );
  const elements = Object.fromEntries(CLOUD_KINDS.map((k) => [k, [] as CloudElement[]])) as Record<CloudKind, CloudElement[]>;
  for (const row of els.rows) elements[row.kind as CloudKind].push({ ...(row as CloudElement), image: toImage(row.image, row.title) });
  return { ...head, elements };
}

/** The whole cloud as one plain-text document for an AI's context ("Copy for AI"). */
export function cloudAsText(c: Cloud): string {
  const lines: string[] = [];
  lines.push(`# ${c.title}`);
  const by = [c.creator_name && `by ${c.creator_name}`, c.genre].filter(Boolean).join(" · ");
  if (by) lines.push(by);
  if (c.description) lines.push("", c.description);
  if (c.source_title && c.source_title !== c.title) lines.push("", `Source: ${c.source_title}${c.source_author ? ` by ${c.source_author}` : ""}`);
  lines.push("", `Context cloud from ConteXtube: ${siteUrl()}/cloud/${c.slug}. Elements are grouped by kind; plot beats are in the order the story tells them.`);
  for (const kind of ["plot", "characters", "stage", "universe", "ideas", "references"] as CloudKind[]) {
    const list = c.elements[kind];
    if (!list.length) continue;
    lines.push("", `## ${KIND_LABELS[kind]}`);
    let act = "";
    for (const e of list) {
      const m = e.metadata ?? {};
      if (kind === "plot" && typeof m.act === "string" && m.act && m.act !== act) {
        act = m.act;
        lines.push("", `### ${act}`);
      }
      const when = kind === "plot" && typeof m.when === "string" && m.when !== "main" ? ` [${m.when.replace("_", "-")}]`
        : kind === "references" && m.origin === "association" ? ` [association${typeof m.link === "string" ? `: ${m.link}` : ""}]` : "";
      const aliases = Array.isArray(m.aliases) && m.aliases.length ? ` (also: ${m.aliases.join(", ")})` : "";
      lines.push("", `**${e.title}**${aliases}${when}`, e.text);
      if (typeof m.initial_state === "string" && m.initial_state) lines.push(`At first: ${m.initial_state}`);
      if (typeof m.source_quote === "string" && m.source_quote) lines.push(`> ${m.source_quote}`);
    }
  }
  return lines.join("\n").trim() + "\n";
}

/** Publishes or replaces a cloud. Same ownership rules as works, plus the owner a multi-user writer names. */
export async function publishCloud(input: CloudInput, writer: string) {
  const slug = input.slug ?? slugify(input.title);
  const position = new Map<CloudKind, number>();
  const elements = input.elements.map((e) => {
    const kind = e.kind as CloudKind;
    const p = position.get(kind) ?? 0;
    position.set(kind, p + 1);
    const img = e.image ? toImage(e.image, e.title) : null;
    return { kind, position: p, title: e.title, text: e.text, image: img ? JSON.stringify(img) : null, metadata: JSON.stringify(e.metadata ?? {}) };
  });

  return withTransaction(async (db) => {
    const existing = await db.query<{ published_by: string | null; owner: string | null }>(
      `SELECT published_by, owner FROM clouds WHERE slug = $1 FOR UPDATE`,
      [slug],
    );
    const prev = existing.rows[0];
    if (prev && !isEditor(writer)) {
      if (prev.published_by && prev.published_by !== writer) throw new SlugTakenError(slug);
      if (prev.owner && prev.owner !== input.owner) throw new SlugTakenError(slug);
    }

    let flowId: string | null = null;
    if (input.flow) {
      const flow = await db.query<{ id: string }>(
        `INSERT INTO flows (slug, name, creator_name) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET creator_name = COALESCE($3, flows.creator_name)
         RETURNING id`,
        [input.flow, input.flow_name ?? input.creator_name ?? input.flow, input.creator_name ?? null],
      );
      flowId = flow.rows[0].id;
    }

    const cover = input.cover ? toImage(input.cover, input.title) : null;
    const row = await db.query<{ id: string; created: boolean }>(
      `INSERT INTO clouds (slug, title, description, genre, creator_name, flow_id, work_slug, rights, source_title,
         source_author, purchase_url, cover, element_count, status, published_by, owner)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description, genre = EXCLUDED.genre,
         creator_name = EXCLUDED.creator_name, flow_id = EXCLUDED.flow_id, work_slug = EXCLUDED.work_slug,
         rights = EXCLUDED.rights, source_title = EXCLUDED.source_title, source_author = EXCLUDED.source_author,
         purchase_url = EXCLUDED.purchase_url, cover = EXCLUDED.cover, element_count = EXCLUDED.element_count,
         status = EXCLUDED.status, published_by = EXCLUDED.published_by,
         owner = COALESCE(EXCLUDED.owner, clouds.owner), updated_at = now()
       RETURNING id, (xmax = 0) AS created`,
      [slug, input.title, input.description, input.genre ?? null, input.creator_name ?? null, flowId, input.work ?? null,
        input.rights, input.source_title ?? null, input.source_author ?? null, input.purchase_url ?? null,
        cover ? JSON.stringify(cover) : null, elements.length, input.status, writer, input.owner ?? null],
    );
    const { id, created } = row.rows[0];

    await db.query(`DELETE FROM cloud_elements WHERE cloud_id = $1`, [id]);
    for (let i = 0; i < elements.length; i += 200) {
      const batch = elements.slice(i, i + 200);
      const values: unknown[] = [];
      const rows = batch.map((e) => {
        values.push(id, e.kind, e.position, e.title, e.text, e.image, e.metadata);
        const b = values.length - 7;
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6}::jsonb,$${b + 7}::jsonb)`;
      });
      await db.query(`INSERT INTO cloud_elements (cloud_id, kind, position, title, text, image, metadata) VALUES ${rows.join(",")}`, values);
    }
    return { id, slug, created, element_count: elements.length };
  });
}

/** Takes a cloud down (kept as a draft). Only its writer, or an editor, may do this. */
export async function unpublishCloud(slug: string, writer: string, owner?: string): Promise<"ok" | "not_found" | "forbidden"> {
  const r = await query<{ published_by: string | null; owner: string | null }>(`SELECT published_by, owner FROM clouds WHERE slug = $1`, [slug]);
  const row = r.rows[0];
  if (!row) return "not_found";
  if (!isEditor(writer) && ((row.published_by && row.published_by !== writer) || (row.owner && row.owner !== owner))) return "forbidden";
  await query(`UPDATE clouds SET status = 'draft', updated_at = now() WHERE slug = $1`, [slug]);
  return "ok";
}

/** An illustrated element for the home page: what it shows and which cloud it belongs to. */
export type CloudHighlight = {
  id: string;
  kind: CloudKind;
  title: string;
  text: string;
  image: Img;
  cloud_slug: string;
  cloud_title: string;
};

/**
 * Illustrated characters, places and beats from every published cloud, interleaved so neighbours come
 * from different clouds. The order changes once a day.
 */
export async function getCloudHighlights(limit = 12): Promise<CloudHighlight[]> {
  const r = await query(
    `SELECT id, kind, title, text, image, cloud_slug, cloud_title FROM (
       SELECT e.id, e.kind, e.title, e.text, e.image, c.slug AS cloud_slug, c.title AS cloud_title,
              md5(e.id::text || current_date::text) AS shuffle,
              row_number() OVER (PARTITION BY c.id ORDER BY md5(e.id::text || current_date::text)) AS turn
       FROM cloud_elements e JOIN clouds c ON c.id = e.cloud_id
       WHERE c.status = 'published' AND e.image IS NOT NULL AND e.kind IN ('characters', 'stage', 'plot')
     ) x ORDER BY turn, shuffle LIMIT $1`,
    [Math.min(Math.max(limit, 1), 40)],
  );
  return r.rows
    .map((row) => ({ ...(row as CloudHighlight), image: toImage(row.image, row.title as string) as Img }))
    .filter((h) => h.image);
}

/** Up to `per` illustrations from each cloud (characters first), for previews in lists. */
export async function getCloudThumbs(per = 4): Promise<Record<string, Img[]>> {
  const r = await query<{ slug: string; image: unknown; title: string }>(
    `SELECT slug, image, title FROM (
       SELECT c.slug, e.image, e.title,
              row_number() OVER (PARTITION BY c.id ORDER BY array_position(ARRAY['characters','stage','plot','universe','ideas','references'], e.kind), e.position) AS n
       FROM cloud_elements e JOIN clouds c ON c.id = e.cloud_id
       WHERE c.status = 'published' AND e.image IS NOT NULL
     ) x WHERE n <= $1`,
    [per],
  );
  const out: Record<string, Img[]> = {};
  for (const row of r.rows) {
    const img = toImage(row.image, row.title);
    if (img) (out[row.slug] ??= []).push(img);
  }
  return out;
}

/** How much the library holds, for the home page. */
export async function getLibraryStats(): Promise<{ works: number; clouds: number; elements: number; essences: number }> {
  const r = await query<{ works: string; clouds: string; elements: string; essences: string }>(
    `SELECT (SELECT count(*) FROM content_units WHERE status = 'published') AS works,
            (SELECT count(*) FROM clouds WHERE status = 'published') AS clouds,
            (SELECT coalesce(sum(element_count), 0) FROM clouds WHERE status = 'published') AS elements,
            (SELECT count(*) FROM chunks c JOIN content_units u ON u.id = c.content_id
              WHERE u.status = 'published' AND c.layer IN (1, 2)) AS essences`,
  );
  const x = r.rows[0];
  return { works: Number(x?.works ?? 0), clouds: Number(x?.clouds ?? 0), elements: Number(x?.elements ?? 0), essences: Number(x?.essences ?? 0) };
}
