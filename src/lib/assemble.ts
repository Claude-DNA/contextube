import { query } from "./db";
import type { Chunk, ContentUnit } from "./content";

export type AssembleRequest = {
  contentId: string;
  maxTokens?: number;
  maxLayer?: number;
  strategy?: "relevant" | "complete" | "custom";
  focus?: string[] | string;
  chunkIds?: string[];
};

export type AssembleResult = {
  content: Pick<ContentUnit, "id" | "slug" | "title">;
  strategy: string;
  layers: { layer: number; chunks: Chunk[] }[];
  usage: { tokens_used: number; tokens_budget: number; chunks_returned: number; chunks_omitted: number };
};

type Scored = Chunk & { focus_rank: number };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function focusTerms(focus: AssembleRequest["focus"]): string[] {
  if (!focus) return [];
  const list = Array.isArray(focus) ? focus : [focus];
  return list.map((f) => f.trim()).filter(Boolean);
}

/**
 * Selects the best chunks of one unit within a token budget.
 * relevant: score = importance × focus match (when focus given); the unit's top L1 chunk is always kept.
 * complete: fills layer by layer, L1 first. custom: chunkIds in order, cut at the budget.
 */
export async function assemble(req: AssembleRequest): Promise<AssembleResult | null> {
  const budget = Math.min(Math.max(req.maxTokens ?? 4000, 50), 200_000);
  const maxLayer = Math.min(Math.max(req.maxLayer ?? 3, 1), 5);
  const strategy = req.strategy ?? "relevant";
  const focus = focusTerms(req.focus);

  const unitRes = await query<Pick<ContentUnit, "id" | "slug" | "title">>(
    `SELECT id, slug, title FROM content_units
     WHERE ${UUID_RE.test(req.contentId) ? "id = $1::uuid" : "slug = $1"} AND status = 'published'`,
    [req.contentId],
  );
  const unit = unitRes.rows[0];
  if (!unit) return null;

  // Focus terms are OR-ed so any one of them can lift a chunk.
  const focusQuery = focus.map((f) => f.replace(/[()|&!:<>'"]/g, " ")).join(" or ");
  const rows = await query<Scored>(
    `SELECT c.id, c.layer, c.chunk_type, c.position, c.extract, c.text, c.source_quote, c.tokens,
            c.importance, c.tags, c.images, c.metadata,
            CASE WHEN $3 = '' THEN 0
                 ELSE ts_rank_cd(c.search, websearch_to_tsquery('simple', $3)) END::float AS focus_rank
     FROM chunks c
     WHERE c.content_id = $1 AND c.layer <= $2
     ORDER BY c.layer, c.position`,
    [unit.id, strategy === "custom" ? 5 : maxLayer, focusQuery],
  );
  const all = rows.rows;

  let selected: Scored[] = [];
  let used = 0;
  const take = (c: Scored) => {
    if (used + c.tokens > budget) return false;
    selected.push(c);
    used += c.tokens;
    return true;
  };

  if (strategy === "custom") {
    const byId = new Map(all.map((c) => [c.id, c]));
    for (const id of req.chunkIds ?? []) {
      const c = byId.get(id);
      if (c && !take(c)) break;
    }
  } else if (strategy === "complete") {
    for (const c of all) take(c);
  } else {
    const maxRank = Math.max(0, ...all.map((c) => c.focus_rank));
    const score = (c: Scored) =>
      focus.length && maxRank > 0 ? c.importance * (0.25 + 0.75 * (c.focus_rank / maxRank)) : c.importance;
    // Every answer opens with the unit's essence.
    const essence = all.filter((c) => c.layer === 1).sort((a, b) => b.importance - a.importance)[0];
    if (essence) take(essence);
    const rest = all
      .filter((c) => c !== essence)
      .sort((a, b) => score(b) - score(a) || a.layer - b.layer || a.position - b.position);
    // Skip a chunk that does not fit and keep trying smaller ones.
    for (const c of rest) take(c);
  }

  if (strategy !== "custom") {
    selected = selected.sort((a, b) => a.layer - b.layer || a.position - b.position);
  }

  const layers = [...new Set(selected.map((c) => c.layer))].map((layer) => ({
    layer,
    chunks: selected.filter((c) => c.layer === layer).map(({ focus_rank: _f, ...c }) => c),
  }));
  const pool = strategy === "custom" ? (req.chunkIds?.length ?? 0) : all.length;

  return {
    content: unit,
    strategy,
    layers,
    usage: {
      tokens_used: used,
      tokens_budget: budget,
      chunks_returned: selected.length,
      chunks_omitted: Math.max(pool - selected.length, 0),
    },
  };
}

/** Plain-text rendering of an assembled context, for agents that want one block to read. */
export function assembledToText(r: AssembleResult, layerName: (n: number) => string): string {
  const parts = [`# ${r.content.title}`];
  for (const l of r.layers) {
    parts.push(`\n## L${l.layer} — ${layerName(l.layer)}`);
    for (const c of l.chunks) {
      const lines = [];
      if (c.extract) lines.push(`**${c.extract}**`);
      lines.push(c.text);
      if (c.source_quote) lines.push(`> ${c.source_quote}`);
      parts.push(lines.join("\n"));
    }
  }
  parts.push(`\n(${r.usage.tokens_used}/${r.usage.tokens_budget} tokens, ${r.usage.chunks_omitted} chunks omitted)`);
  return parts.join("\n\n");
}
