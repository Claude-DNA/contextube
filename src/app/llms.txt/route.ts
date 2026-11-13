import { siteUrl } from "@/lib/http";
import { listContent } from "@/lib/content";
import { listClouds } from "@/lib/clouds";

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
  let cloudList = "";
  try {
    const { clouds } = await listClouds({ limit: 100 });
    cloudList = clouds.map((c) => `- [${c.title}](${site}/api/v1/clouds/${c.slug}/text): ${c.description}`).join("\n") || "(none yet)";
  } catch {
    cloudList = "(list unavailable; use GET /api/v1/clouds)";
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
GET /api/v1/content/{id}/layer/5?q=matches+camphor&limit=5  → only the passages that best match those words (any layer takes ?q=)

### Step 4: Assemble optimized context
POST /api/v1/assemble
Body: {"contentId": "...", "maxTokens": 4000, "maxLayer": 3, "focus": ["concept"]}
Returns: the best chunks within your token budget, grouped by layer

### Story clouds
A cloud is a work's story bible: plot beats in story order (acts and flashbacks marked), characters, places, world rules, ideas and references, with quotes from the text.
GET /api/v1/clouds               → list clouds
GET /api/v1/clouds/{slug}        → JSON, elements grouped by kind
GET /api/v1/clouds/{slug}/text   → the whole cloud as one Markdown document, ready for your context
GET /api/v1/clouds/{slug}/file   → the whole cloud as one .cloud.json file (format "context-cloud"), to keep or reopen in Context Cloud Studio

## The 5 Layers
Layer 1 — Abstract Associations: gut feelings and associations, as a symbolic extract (~50 tokens)
Layer 2 — Ideas & Evidence: ideas backed by direct quotes from the source (~200 tokens)
Layer 3 — Connections: cross-references between works and domains (~300 tokens)
Layer 4 — Synthesis: commentary and analysis, the "so what" (~500 tokens)
Layer 5 — Full Narrative & Meta: the full source with notes on how the context was made (~1000+ tokens)

## Tips
- Start with Layer 1 for a quick relevance check before loading deeper layers
- Use the cloud or layers 1–4 for what a work means; for a specific fact, confirm it with a layer-5 search (?q=) rather than answering from the cloud alone. In our tests that pairing matched reading the full text at about a tenth of the tokens
- Use /search to find content by concept, not just title
- Each chunk is self-contained — you can use any chunk independently
- Extracts are compressed semantic formulas (→ leads to, ↔ tension, = equivalence, ∅ absence, ∞ deep bond, ∴ therefore, ⊂ within, . qualifier), useful as index keys

## MCP
Streamable HTTP server: ${site}/api/mcp
Tools: search_content, list_content, get_content, get_layer, assemble_context, list_flows, list_clouds, get_cloud

## Available Content
${catalog}

## Available Clouds
${cloudList}

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
