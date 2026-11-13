/** OpenAPI 3.1 for ConteXtube v1. Paths and fields from February 2026 are kept; additions are optional. */
const imageSchema = {
  oneOf: [
    { type: "string", description: "Image URL" },
    {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string" },
        alt: { type: "string", description: "What the image shows" },
        credit: { type: "string", description: "Title, maker, date and collection" },
        source: { type: "string", description: "Page the image came from" },
      },
    },
  ],
};

export function openapi(site: string) {
  const unitRef = { $ref: "#/components/schemas/ContentUnit" };
  const chunkRef = { $ref: "#/components/schemas/Chunk" };
  const idParam = { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Content uuid or slug" };
  const errorResponse = { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } };

  return {
    openapi: "3.1.0",
    info: {
      title: "ConteXtube API",
      description: "Structured narratives for AI. Five-layer context decomposition of literature, essays, philosophy and cultural works. Reads need no key.",
      version: "1.1.0",
      contact: { email: "hello@contextube.ai", url: site },
    },
    servers: [{ url: `${site}/api/v1`, description: "Production" }],
    paths: {
      "/content": {
        get: {
          operationId: "listContent",
          summary: "Browse all available content",
          description: "List published content units, newest first, filtered by flow, tag, domain or language.",
          parameters: [
            { name: "flow", in: "query", schema: { type: "string" }, description: "Filter by flow slug" },
            { name: "tag", in: "query", schema: { type: "string" }, description: "Filter by tag" },
            { name: "domain", in: "query", schema: { type: "string" }, description: "Filter by domain (literature, philosophy, film, etc.)" },
            { name: "language", in: "query", schema: { type: "string" }, description: "Filter by language code, e.g. en, ru" },
            { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            "200": {
              description: "List of content units",
              content: { "application/json": { schema: { type: "object", properties: { content: { type: "array", items: unitRef }, total: { type: "integer" } } } } },
            },
          },
        },
      },
      "/content/{id}": {
        get: {
          operationId: "getContent",
          summary: "Get content details with layer statistics",
          parameters: [idParam],
          responses: { "200": { description: "The unit with per-layer chunk and token counts, plus its top L1 essence" }, "404": errorResponse },
        },
      },
      "/content/{id}/layer/{layer}": {
        get: {
          operationId: "getLayer",
          summary: "Get all chunks for a specific layer",
          description: "Layer 1: Abstract Associations. Layer 2: Ideas & Evidence. Layer 3: Connections. Layer 4: Synthesis. Layer 5: Full Narrative & Meta.",
          parameters: [idParam, { name: "layer", in: "path", required: true, schema: { type: "integer", minimum: 1, maximum: 5 } }, { name: "q", in: "query", description: "Return only the chunks of this layer that best match these words (any of them), in reading order. Use on layer 5 to fetch the passages a question needs.", schema: { type: "string" } }, { name: "limit", in: "query", description: "With q: how many chunks, 1 to 20 (default 5).", schema: { type: "integer" } }],
          responses: {
            "200": { description: "Chunks of the layer in reading order", content: { "application/json": { schema: { type: "object", properties: { chunks: { type: "array", items: chunkRef } } } } } },
            "404": errorResponse,
          },
        },
      },
      "/search": {
        get: {
          operationId: "searchContent",
          summary: "Search content by concept, title, or keyword",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
          ],
          responses: { "200": { description: "Units ranked by relevance score, each with its best-matching chunks" } },
        },
      },
      "/flows": {
        get: { operationId: "listFlows", summary: "List all content flows (collections by creator)", responses: { "200": { description: "Flows with content counts" } } },
      },
      "/clouds": {
        get: {
          operationId: "listClouds",
          summary: "List story clouds",
          description: "Published clouds: works' story bibles (plot beats in story order, characters, places, world rules, ideas, references), newest first.",
          parameters: [
            { name: "flow", in: "query", schema: { type: "string" }, description: "Filter by the creator's flow slug" },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: { "200": { description: "{ clouds, total }" } },
        },
        post: {
          operationId: "publishCloud",
          summary: "Publish or replace a cloud",
          description: "Requires a publish key. Body: { title, description?, genre?, creator_name?, flow?, work?, rights?, cover?, owner?, elements: [{ kind: plot|characters|stage|universe|ideas|references (Studio's arc, scenes, world also work), title, text, image?, metadata? }] }. Elements of each kind keep the order sent.",
          security: [{ publishKey: [] }],
          responses: { "201": { description: "Published" }, "200": { description: "Replaced" }, "409": errorResponse, "422": errorResponse },
        },
      },
      "/clouds/{slug}": {
        get: {
          operationId: "getCloud",
          summary: "Get a cloud with its elements",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "{ cloud } with elements grouped by kind" }, "404": errorResponse },
        },
        delete: {
          operationId: "unpublishCloud",
          summary: "Take a cloud down",
          security: [{ publishKey: [] }],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Unpublished" }, "403": errorResponse, "404": errorResponse },
        },
      },
      "/clouds/{slug}/text": {
        get: {
          operationId: "getCloudText",
          summary: "Get a cloud as one plain-text document",
          description: "Markdown for an AI's context: plot beats in story order with acts and flashbacks marked, then characters, places, world rules, ideas and references, with quotes.",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "text/markdown" }, "404": errorResponse },
        },
      },
      "/clouds/{slug}/file": {
        get: {
          operationId: "getCloudFile",
          summary: "Get a cloud as one .cloud.json file",
          description: "The whole cloud in the context-cloud file format: { format, version, cloud: {...}, elements: [{ kind, title, text, image?, metadata? }] }. Context Cloud Studio saves and opens the same file. ?download=0 returns plain JSON.",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }, { name: "download", in: "query", schema: { type: "string", enum: ["0"] } }],
          responses: { "200": { description: "application/vnd.context-cloud+json" }, "404": errorResponse },
        },
      },
      "/categories": {
        get: { operationId: "listCategories", summary: "List all available domains and tags with counts", responses: { "200": { description: "Domains and tags with counts" } } },
      },
      "/feed": {
        get: {
          operationId: "getFeed",
          summary: "Essence feed: L1 chunks across the library, newest works first",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 30 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: { "200": { description: "Feed cards" } },
        },
      },
      "/assemble": {
        post: {
          operationId: "assembleContext",
          summary: "Assemble optimized context within a token budget",
          description: "Selects the best chunks of one unit to fit a token budget, by importance and optional focus concepts. The unit's top L1 chunk is always included under strategy 'relevant'.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["contentId"],
                  properties: {
                    contentId: { type: "string", description: "Content uuid or slug" },
                    maxTokens: { type: "integer", default: 4000, description: "Token budget" },
                    maxLayer: { type: "integer", default: 3, description: "Deepest layer to include (1-5)" },
                    strategy: { type: "string", enum: ["relevant", "complete", "custom"], default: "relevant" },
                    focus: { oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }], description: "Concepts to prioritize" },
                    chunkIds: { type: "array", items: { type: "string" }, description: "Specific chunks (for custom strategy)" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Chunks grouped by layer, plus usage: tokens_used, tokens_budget, chunks_returned, chunks_omitted" }, "404": errorResponse },
        },
      },
      "/publish": {
        post: {
          operationId: "publishContent",
          summary: "Publish or replace a content unit (writers only)",
          description: "Upserts by slug. Sending a unit again replaces all its chunks. The server computes token counts. Needs Authorization: Bearer <publish key>.",
          security: [{ publishKey: [] }],
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PublishRequest" } } } },
          responses: {
            "201": { description: "Created: { content: { id, slug, url }, chunk_count, total_tokens }" },
            "200": { description: "Replaced an existing unit" },
            "401": errorResponse,
            "422": errorResponse,
          },
        },
      },
      "/publish/{slug}": {
        delete: {
          operationId: "unpublishContent",
          summary: "Unpublish a unit (writers only). Nothing is hard-deleted.",
          security: [{ publishKey: [] }],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Unpublished" }, "404": errorResponse },
        },
      },
    },
    components: {
      securitySchemes: { publishKey: { type: "http", scheme: "bearer" } },
      schemas: {
        ContentUnit: {
          type: "object",
          properties: {
            id: { type: "string" },
            slug: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            flow_name: { type: ["string", "null"] },
            chunk_count: { type: "integer" },
            total_tokens: { type: "integer" },
            tags: { type: "array", items: { type: "string" } },
            domains: { type: "array", items: { type: "string" } },
            language: { type: "string" },
            source_title: { type: ["string", "null"] },
            source_author: { type: ["string", "null"] },
            rights: { type: "string", enum: ["own", "public_domain", "copyrighted"] },
            purchase_url: { type: ["string", "null"] },
            cover: { oneOf: [imageSchema, { type: "null" }] },
          },
        },
        Chunk: {
          type: "object",
          properties: {
            id: { type: "string" },
            layer: { type: "integer" },
            chunk_type: { type: "string", enum: ["idea", "narrative", "meta"] },
            position: { type: "integer" },
            text: { type: "string" },
            extract: { type: ["string", "null"], description: "Compressed semantic formula (2-8 words)" },
            tokens: { type: "integer" },
            importance: { type: "number" },
            source_quote: { type: ["string", "null"] },
            metadata: { type: "object", description: "metadata.links names connected works (L3)" },
          },
        },
        PublishRequest: {
          type: "object",
          required: ["title", "chunks"],
          properties: {
            slug: { type: "string", description: "Defaults to a slug of the title" },
            flow: { type: "string", description: "Flow slug; created if new" },
            flow_name: { type: "string" },
            creator_name: { type: "string" },
            flow_cover: imageSchema,
            cover: imageSchema,
            title: { type: "string" },
            description: { type: "string" },
            language: { type: "string", default: "en" },
            tags: { type: "array", items: { type: "string" } },
            domains: { type: "array", items: { type: "string" } },
            status: { type: "string", enum: ["draft", "published"], default: "published" },
            source_title: { type: "string" },
            source_author: { type: "string" },
            rights: { type: "string", enum: ["own", "public_domain", "copyrighted"], default: "own" },
            purchase_url: { type: "string", description: "Required in practice for copyrighted works" },
            chunks: {
              type: "array",
              items: {
                type: "object",
                required: ["layer", "text"],
                properties: {
                  layer: { type: "integer", minimum: 1, maximum: 5 },
                  type: { type: "string", enum: ["idea", "narrative", "meta"] },
                  extract: { type: "string", description: "2-8 words; symbols → ↔ = ∅ ∞ ∴ ⊂ ." },
                  text: { type: "string" },
                  source_quote: { type: "string", description: "Required for layer 2" },
                  importance: { type: "number", minimum: 0, maximum: 1, default: 0.5 },
                  tags: { type: "array", items: { type: "string" } },
                  links: { type: "array", items: { type: "string" }, description: "Slugs of connected works (L3)" },
                  images: { type: "array", maxItems: 5, items: imageSchema },
                  metadata: { type: "object" },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" }, details: {} } } },
        },
      },
    },
  };
}
