import { query, withTransaction } from "./db";
import { chunkTokens } from "./tokens";
import { slugify } from "./slug";
import type { PublishInput } from "./validate";

// ---------- Shapes returned by every surface (REST, MCP, pages) ----------

export type ContentUnit = {
  id: string;
  slug: string;
  title: string;
  description: string;
  flow_name: string | null;
  flow_slug: string | null;
  chunk_count: number;
  total_tokens: number;
  tags: string[];
  domains: string[];
  language: string;
  source_title: string | null;
  source_author: string | null;
  rights: "own" | "public_domain" | "copyrighted";
  purchase_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Chunk = {
  id: string;
  layer: number;
  chunk_type: "idea" | "narrative" | "meta";
  position: number;
  extract: string | null;
  text: string;
  source_quote: string | null;
  tokens: number;
  importance: number;
  tags: string[];
  images: unknown[];
  metadata: Record<string, unknown>;
};

const UNIT_COLUMNS = `
  u.id, u.slug, u.title, u.description, f.name AS flow_name, f.slug AS flow_slug,
  u.chunk_count, u.total_tokens, u.tags, u.domains, u.language, u.source_title,
  u.source_author, u.rights, u.purchase_url, u.created_at, u.updated_at`;

const CHUNK_COLUMNS = `
  c.id, c.layer, c.chunk_type, c.position, c.extract, c.text, c.source_quote,
  c.tokens, c.importance, c.tags, c.images, c.metadata`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `{id}` in any path accepts the uuid or the slug. */
function idClause(idOrSlug: string, param = "$1") {
  return UUID_RE.test(idOrSlug) ? `u.id = ${param}::uuid` : `u.slug = ${param}`;
}

// ---------- Reads ----------

export type ListFilters = {
  flow?: string;
  tag?: string;
  domain?: string;
  language?: string;
  limit?: number;
  offset?: number;
};

export async function listContent(f: ListFilters = {}): Promise<{ content: ContentUnit[]; total: number }> {
  const where: string[] = ["u.status = 'published'"];
  const params: unknown[] = [];
  if (f.flow) { params.push(f.flow); where.push(`f.slug = $${params.length}`); }
  if (f.tag) { params.push(f.tag); where.push(`$${params.length} = ANY(u.tags)`); }
  if (f.domain) { params.push(f.domain); where.push(`$${params.length} = ANY(u.domains)`); }
  if (f.language) { params.push(f.language); where.push(`u.language = $${params.length}`); }
  const limit = Math.min(Math.max(f.limit ?? 20, 1), 100);
  const offset = Math.max(f.offset ?? 0, 0);
  const whereSql = where.join(" AND ");

  const [rows, count] = await Promise.all([
    query<ContentUnit>(
      `SELECT ${UNIT_COLUMNS} FROM content_units u LEFT JOIN flows f ON f.id = u.flow_id
       WHERE ${whereSql} ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params,
    ),
    query<{ n: string }>(
      `SELECT count(*) AS n FROM content_units u LEFT JOIN flows f ON f.id = u.flow_id WHERE ${whereSql}`,
      params,
    ),
  ]);
  return { content: rows.rows, total: Number(count.rows[0]?.n ?? 0) };
}

export type LayerStat = { layer: number; chunks: number; tokens: number };

export async function getContent(idOrSlug: string): Promise<
  (ContentUnit & { layers: LayerStat[]; essence: Chunk[] }) | null
> {
  const unit = await query<ContentUnit>(
    `SELECT ${UNIT_COLUMNS} FROM content_units u LEFT JOIN flows f ON f.id = u.flow_id
     WHERE ${idClause(idOrSlug)} AND u.status = 'published'`,
    [idOrSlug],
  );
  const u = unit.rows[0];
  if (!u) return null;
  const [stats, essence] = await Promise.all([
    query<{ layer: number; chunks: string; tokens: string }>(
      `SELECT layer, count(*) AS chunks, sum(tokens) AS tokens FROM chunks
       WHERE content_id = $1 GROUP BY layer ORDER BY layer`,
      [u.id],
    ),
    query<Chunk>(
      `SELECT ${CHUNK_COLUMNS} FROM chunks c WHERE c.content_id = $1 AND c.layer = 1
       ORDER BY c.importance DESC, c.position LIMIT 3`,
      [u.id],
    ),
  ]);
  return {
    ...u,
    layers: stats.rows.map((s) => ({ layer: s.layer, chunks: Number(s.chunks), tokens: Number(s.tokens) })),
    essence: essence.rows,
  };
}

export async function getLayer(idOrSlug: string, layer: number): Promise<{ content: Pick<ContentUnit, "id" | "slug" | "title">; layer: number; chunks: Chunk[] } | null> {
  const unit = await query<Pick<ContentUnit, "id" | "slug" | "title">>(
    `SELECT u.id, u.slug, u.title FROM content_units u WHERE ${idClause(idOrSlug)} AND u.status = 'published'`,
    [idOrSlug],
  );
  const u = unit.rows[0];
  if (!u) return null;
  const chunks = await query<Chunk>(
    `SELECT ${CHUNK_COLUMNS} FROM chunks c WHERE c.content_id = $1 AND c.layer = $2 ORDER BY c.position`,
    [u.id, layer],
  );
  return { content: u, layer, chunks: chunks.rows };
}

export async function getAllChunks(unitId: string): Promise<Chunk[]> {
  const r = await query<Chunk>(
    `SELECT ${CHUNK_COLUMNS} FROM chunks c WHERE c.content_id = $1 ORDER BY c.layer, c.position`,
    [unitId],
  );
  return r.rows;
}

export type SearchHit = {
  content: Pick<ContentUnit, "id" | "slug" | "title" | "description" | "language" | "tags" | "domains">;
  score: number;
  matches: Pick<Chunk, "id" | "layer" | "extract" | "text">[];
};

/** Keyword search over titles, tags and chunk text, ranked by Postgres full-text relevance. */
export async function searchContent(q: string, limit = 10): Promise<SearchHit[]> {
  const term = q.trim();
  if (!term) return [];
  const like = `%${term.replace(/[%_]/g, "\\$&")}%`;
  const r = await query<{
    id: string; slug: string; title: string; description: string; language: string;
    tags: string[]; domains: string[]; score: number;
    matches: { id: string; layer: number; extract: string | null; text: string }[];
  }>(
    `WITH q AS (SELECT websearch_to_tsquery('simple', $1) AS tsq),
     chunk_hits AS (
       SELECT c.content_id, c.id, c.layer, c.extract, left(c.text, 280) AS text,
              ts_rank(c.search, q.tsq) * (0.5 + c.importance) AS rank
       FROM chunks c, q
       WHERE c.search @@ q.tsq OR c.extract ILIKE $2 OR c.text ILIKE $2
     ),
     unit_hits AS (
       SELECT u.id,
              (CASE WHEN u.title ILIKE $2 THEN 1.0 ELSE 0 END)
            + (CASE WHEN EXISTS (SELECT 1 FROM unnest(u.tags || u.domains) t WHERE t ILIKE $2) THEN 0.5 ELSE 0 END) AS rank
       FROM content_units u WHERE u.status = 'published'
     )
     SELECT u.id, u.slug, u.title, u.description, u.language, u.tags, u.domains,
            (coalesce(uh.rank, 0) + coalesce(sum(ch.rank), 0) + count(ch.id) * 0.01)::float AS score,
            coalesce(
              (SELECT json_agg(m) FROM (
                 SELECT id, layer, extract, text FROM chunk_hits WHERE content_id = u.id
                 ORDER BY rank DESC LIMIT 3) m),
              '[]'::json) AS matches
     FROM content_units u
     JOIN unit_hits uh ON uh.id = u.id
     LEFT JOIN chunk_hits ch ON ch.content_id = u.id
     WHERE u.status = 'published'
     GROUP BY u.id, uh.rank
     HAVING coalesce(uh.rank, 0) > 0 OR count(ch.id) > 0
     ORDER BY score DESC
     LIMIT $3`,
    [term, like, Math.min(Math.max(limit, 1), 50)],
  );
  return r.rows.map(({ score, matches, ...content }) => ({
    content,
    score: Math.round(score * 1000) / 1000,
    matches,
  }));
}

export async function listFlows() {
  const r = await query<{ id: string; slug: string; name: string; creator_name: string | null; description: string | null; content_count: string }>(
    `SELECT f.id, f.slug, f.name, f.creator_name, f.description,
            count(u.id) FILTER (WHERE u.status = 'published') AS content_count
     FROM flows f LEFT JOIN content_units u ON u.flow_id = f.id
     GROUP BY f.id ORDER BY f.name`,
  );
  return r.rows.map((f) => ({ ...f, content_count: Number(f.content_count) }));
}

export async function getFlow(slug: string) {
  const r = await query<{ id: string; slug: string; name: string; creator_name: string | null; description: string | null }>(
    `SELECT id, slug, name, creator_name, description FROM flows WHERE slug = $1`,
    [slug],
  );
  return r.rows[0] ?? null;
}

export async function listCategories() {
  const [domains, tags] = await Promise.all([
    query<{ name: string; count: string }>(
      `SELECT d AS name, count(*) AS count FROM content_units, unnest(domains) d
       WHERE status = 'published' GROUP BY d ORDER BY count(*) DESC, d`,
    ),
    query<{ name: string; count: string }>(
      `SELECT t AS name, count(*) AS count FROM content_units, unnest(tags) t
       WHERE status = 'published' GROUP BY t ORDER BY count(*) DESC, t`,
    ),
  ]);
  const toList = (rows: { name: string; count: string }[]) => rows.map((r) => ({ name: r.name, count: Number(r.count) }));
  return { domains: toList(domains.rows), tags: toList(tags.rows) };
}

export type FeedCard = Pick<Chunk, "id" | "layer" | "extract" | "text" | "source_quote" | "importance" | "images"> & {
  content_id: string; content_slug: string; content_title: string; language: string; domains: string[];
};

/**
 * Essence feed, as on the original site: L1 essences and L2 evidence (with its quote) from every work,
 * most important first. Each work's top essence leads, so one long work cannot crowd out the rest.
 */
export async function getFeed(limit = 30, offset = 0): Promise<FeedCard[]> {
  const r = await query<FeedCard>(
    `SELECT c.id, c.layer, c.extract, c.text, c.source_quote, c.importance, c.images,
            u.id AS content_id, u.slug AS content_slug, u.title AS content_title, u.language, u.domains,
            row_number() OVER (PARTITION BY u.id ORDER BY c.layer, c.importance DESC, c.position) AS rank_in_unit
     FROM chunks c JOIN content_units u ON u.id = c.content_id
     WHERE u.status = 'published' AND c.layer IN (1, 2)
     ORDER BY (row_number() OVER (PARTITION BY u.id ORDER BY c.layer, c.importance DESC, c.position) = 1) DESC,
              c.importance DESC, u.created_at DESC, c.layer, c.position
     LIMIT $1 OFFSET $2`,
    [Math.min(limit, 100), offset],
  );
  return r.rows.map(({ rank_in_unit: _r, ...c }: FeedCard & { rank_in_unit?: unknown }) => c);
}

// ---------- Writes ----------

export async function publishContent(input: PublishInput, writer: string) {
  const slug = input.slug ?? slugify(input.title);
  const prepared = input.chunks.map((c, i) => {
    const metadata: Record<string, unknown> = { ...(c.metadata ?? {}) };
    if (c.standalone !== undefined) metadata.standalone = c.standalone;
    if (c.links?.length) metadata.links = c.links;
    return {
      layer: c.layer,
      chunk_type: c.type ?? c.chunk_type ?? (c.layer === 5 ? "narrative" : "idea"),
      extract: c.extract ?? null,
      text: c.text,
      source_quote: c.source_quote ?? null,
      importance: c.importance ?? 0.5,
      tags: c.tags ?? [],
      images: c.images ?? [],
      metadata,
      tokens: chunkTokens({ extract: c.extract, text: c.text, source_quote: c.source_quote }),
      index: i,
    };
  });

  // Position counts from 0 within each layer, in the order sent.
  const perLayer = new Map<number, number>();
  for (const c of prepared) {
    const n = perLayer.get(c.layer) ?? 0;
    (c as typeof c & { position: number }).position = n;
    perLayer.set(c.layer, n + 1);
  }
  const totalTokens = prepared.reduce((s, c) => s + c.tokens, 0);

  return withTransaction(async (db) => {
    let flowId: string | null = null;
    if (input.flow) {
      const flow = await db.query<{ id: string }>(
        `INSERT INTO flows (slug, name, creator_name) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET
           name = COALESCE(NULLIF($4, ''), flows.name),
           creator_name = COALESCE($3, flows.creator_name)
         RETURNING id`,
        [input.flow, input.flow_name ?? input.flow, input.creator_name ?? null, input.flow_name ?? ""],
      );
      flowId = flow.rows[0].id;
    }

    const unit = await db.query<{ id: string; slug: string; created: boolean }>(
      `INSERT INTO content_units
         (flow_id, slug, title, description, language, tags, domains, source_title, source_author,
          rights, purchase_url, status, chunk_count, total_tokens, published_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (slug) DO UPDATE SET
         flow_id = EXCLUDED.flow_id, title = EXCLUDED.title, description = EXCLUDED.description,
         language = EXCLUDED.language, tags = EXCLUDED.tags, domains = EXCLUDED.domains,
         source_title = EXCLUDED.source_title, source_author = EXCLUDED.source_author,
         rights = EXCLUDED.rights, purchase_url = EXCLUDED.purchase_url, status = EXCLUDED.status,
         chunk_count = EXCLUDED.chunk_count, total_tokens = EXCLUDED.total_tokens,
         published_by = EXCLUDED.published_by, updated_at = now()
       RETURNING id, slug, (xmax = 0) AS created`,
      [
        flowId, slug, input.title, input.description, input.language, input.tags, input.domains,
        input.source_title ?? null, input.source_author ?? null, input.rights, input.purchase_url ?? null,
        input.status, prepared.length, totalTokens, writer,
      ],
    );
    const { id, created } = unit.rows[0];

    await db.query(`DELETE FROM chunks WHERE content_id = $1`, [id]);
    // One multi-row insert per 200 chunks keeps round trips low on Neon.
    for (let i = 0; i < prepared.length; i += 200) {
      const batch = prepared.slice(i, i + 200);
      const values: unknown[] = [];
      const rows = batch.map((c) => {
        const p = c as typeof c & { position: number };
        values.push(id, p.layer, p.chunk_type, p.position, p.extract, p.text, p.source_quote,
          p.tokens, p.importance, p.tags, JSON.stringify(p.images), JSON.stringify(p.metadata));
        const b = values.length - 12;
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11}::jsonb,$${b + 12}::jsonb)`;
      });
      await db.query(
        `INSERT INTO chunks (content_id, layer, chunk_type, position, extract, text, source_quote,
           tokens, importance, tags, images, metadata) VALUES ${rows.join(",")}`,
        values,
      );
    }

    return { id, slug, created, chunk_count: prepared.length, total_tokens: totalTokens };
  });
}

export async function unpublishContent(slug: string): Promise<boolean> {
  const r = await query(`UPDATE content_units SET status = 'draft', updated_at = now() WHERE slug = $1`, [slug]);
  return (r.rowCount ?? 0) > 0;
}
