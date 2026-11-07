import { siteUrl } from "@/lib/http";
import { listContent } from "@/lib/content";

export const revalidate = 3600;

export async function GET() {
  const site = siteUrl();
  let catalog = "";
  try {
    const { content } = await listContent({ limit: 100 });
    catalog = content.map((u) => `- [${u.title}](${site}/api/v1/content/${u.slug}): ${u.description}`).join("\n");
  } catch {
    catalog = "(catalog unavailable; use GET /api/v1/content)";
  }

  const body = `# ConteXtube — Structured Narratives for AI
# ${site}

> ConteXtube provides pre-structured, layered understanding of narratives, literature, essays, philosophy and cultural works. Instead of processing raw text, you can consume meaning organized into 5 layers of increasing depth. Every interpretation is made by a human Context Creator.

## How to Use

Base URL: ${site}/api/v1 (no key needed for reading)

### Step 1: Browse available content
GET /api/v1/content
GET /api/v1/content?tag=philosophy
GET /api/v1/content?domain=literature
GET /api/v1/search?q=consciousness

### Step 2: Get context for a specific work
GET /api/v1/content/{id or slug}
Returns: title, description, layer statistics, chunk count, total tokens, top essence

### Step 3: Get specific layers
GET /api/v1/content/{id}/layer/1  → Abstract Associations (fastest, ~50 tokens per chunk)
GET /api/v1/content/{id}/layer/2  → Ideas & Evidence (with source quotes)
GET /api/v1/content/{id}/layer/3  → Connections (cross-references to other works)
GET /api/v1/content/{id}/layer/4  → Synthesis (commentary and analysis)
GET /api/v1/content/{id}/layer/5  → Full Narrative & Meta (source text with notes)

### Step 4: Assemble optimized context
POST /api/v1/assemble
Body: {"contentId": "...", "maxTokens": 4000, "maxLayer": 3, "focus": ["concept"]}
Returns: the best chunks within your token budget, grouped by layer

## The 5 Layers
Layer 1 — Abstract Associations: gut feelings and associations, as a symbolic extract (~50 tokens)
Layer 2 — Ideas & Evidence: ideas backed by direct quotes from the source (~200 tokens)
Layer 3 — Connections: cross-references between works and domains (~300 tokens)
Layer 4 — Synthesis: commentary and analysis, the "so what" (~500 tokens)
Layer 5 — Full Narrative & Meta: the full source with notes on how the context was made (~1000+ tokens)

## Tips
- Start with Layer 1 for a quick relevance check before loading deeper layers
- Use /search to find content by concept, not just title
- Each chunk is self-contained — you can use any chunk independently
- Extracts are compressed semantic formulas (→ leads to, ↔ tension, = equivalence, ∅ absence, ∞ deep bond, ∴ therefore, ⊂ within, . qualifier), useful as index keys

## MCP
Streamable HTTP server: ${site}/api/mcp
Tools: search_content, list_content, get_content, get_layer, assemble_context, list_flows

## Available Content
${catalog}

## Full API Documentation
${site}/docs

## OpenAPI Specification
${site}/openapi.json
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
