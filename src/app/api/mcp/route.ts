import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { rateLimit } from "@/lib/http";
import { listContent, getContent, getLayer, searchContent, listFlows } from "@/lib/content";
import { assemble, assembledToText } from "@/lib/assemble";
import { layerName, LAYERS_INLINE } from "@/lib/layers";

export const maxDuration = 60;

const INSTRUCTIONS = `ConteXtube holds human-made interpretations of works (literature, essays, philosophy, film), each split into five layers of depth:
${LAYERS_INLINE}.
L1 opens with a symbolic extract, L2 ideas carry source quotes, L3 links other works, L4 is the creator's interpretation, L5 is the source text or notes.
Work in this order: search_content → get_content → get_layer with layer 1 → deeper layers, or assemble_context to fit a token budget.`;

/** Every tool answers with readable text plus the same data as JSON. */
function reply(text: string, data: unknown) {
  return {
    content: [
      { type: "text" as const, text },
      { type: "text" as const, text: "```json\n" + JSON.stringify(data, null, 2) + "\n```" },
    ],
  };
}

function notFound(id: string) {
  return { isError: true, content: [{ type: "text" as const, text: `No published content with id or slug "${id}". Try search_content first.` }] };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_content",
      {
        title: "Search ConteXtube",
        description: "Start here. Search the library by topic, keyword or concept. Returns matching works with their best-matching ideas.",
        inputSchema: z.object({
          query: z.string().min(1).describe("Topic, keyword or concept, e.g. 'alignment as partnership'"),
          limit: z.number().int().min(1).max(25).optional().describe("Maximum results (default 10)"),
        }),
      },
      async ({ query, limit }) => {
        const results = await searchContent(query, limit ?? 10);
        const text = results.length
          ? results.map((r, i) => `${i + 1}. ${r.content.title} (slug: ${r.content.slug}, score ${r.score})` +
              r.matches.map((m) => `\n   L${m.layer}: ${m.extract ?? m.text.slice(0, 120)}`).join("")).join("\n")
          : `Nothing matched "${query}". Try broader words or list_content.`;
        return reply(text, results);
      },
    );

    server.registerTool(
      "list_content",
      {
        title: "Browse ConteXtube",
        description: "Browse all published works, newest first, with optional filters.",
        inputSchema: z.object({
          tag: z.string().optional(),
          domain: z.string().optional().describe("e.g. literature, philosophy, ai-alignment"),
          flow: z.string().optional().describe("A creator's collection slug"),
          language: z.string().optional().describe("e.g. en, ru"),
          limit: z.number().int().min(1).max(100).optional(),
          offset: z.number().int().min(0).optional(),
        }),
      },
      async (args) => {
        const r = await listContent(args);
        const text = r.content.map((u) => `- ${u.title} (slug: ${u.slug}, ${u.language}, ${u.total_tokens} tokens) — ${u.description}`).join("\n") || "No content yet.";
        return reply(`${r.total} ${r.total === 1 ? "work" : "works"}.\n${text}`, r);
      },
    );

    server.registerTool(
      "get_content",
      {
        title: "Get a work's overview",
        description: "Metadata, layer statistics and the top L1 essence for one work. Accepts the id or slug from search_content.",
        inputSchema: z.object({ contentId: z.string().min(1).describe("Content id or slug") }),
      },
      async ({ contentId }) => {
        const u = await getContent(contentId);
        if (!u) return notFound(contentId);
        const layers = u.layers.map((l) => `L${l.layer} ${layerName(l.layer)}: ${l.chunks} ${l.chunks === 1 ? "chunk" : "chunks"}, ${l.tokens} tokens`).join("\n");
        const essence = u.essence.map((c) => `- ${c.extract ? c.extract + " — " : ""}${c.text}`).join("\n");
        return reply(`${u.title}\n${u.description}\n\nLayers:\n${layers}\n\nEssence:\n${essence}`, u);
      },
    );

    server.registerTool(
      "get_layer",
      {
        title: "Read one layer",
        description: "All chunks of one layer (1-5) of a work. Start with layer 1; go deeper only as the task needs.",
        inputSchema: z.object({
          contentId: z.string().min(1).describe("Content id or slug"),
          layer: z.number().int().min(1).max(5),
        }),
      },
      async ({ contentId, layer }) => {
        const r = await getLayer(contentId, layer);
        if (!r) return notFound(contentId);
        const text = r.chunks.map((c) => [c.extract && `**${c.extract}**`, c.text, c.source_quote && `> ${c.source_quote}`].filter(Boolean).join("\n")).join("\n\n");
        return reply(`${r.content.title} — L${layer} ${layerName(layer)}\n\n${text || "This layer is empty."}`, r);
      },
    );

    server.registerTool(
      "assemble_context",
      {
        title: "Assemble context to a budget",
        description: "Best chunks of one work that fit a token budget, optionally focused on concepts. Use this to inject context for a task.",
        inputSchema: z.object({
          contentId: z.string().min(1).describe("Content id or slug"),
          maxTokens: z.number().int().min(50).max(200000).optional().describe("Budget (default 4000)"),
          maxLayer: z.number().int().min(1).max(5).optional().describe("Deepest layer allowed (default 3)"),
          strategy: z.enum(["relevant", "complete", "custom"]).optional(),
          focus: z.union([z.array(z.string()), z.string()]).optional().describe("Concepts to prioritize"),
          chunkIds: z.array(z.string()).optional().describe("Exact chunks, for strategy 'custom'"),
        }),
      },
      async (args) => {
        const r = await assemble(args);
        if (!r) return notFound(args.contentId);
        return reply(assembledToText(r, layerName), r);
      },
    );

    server.registerTool(
      "list_flows",
      {
        title: "List creators' collections",
        description: "Flows are collections of works by one creator.",
        inputSchema: z.object({}),
      },
      async () => {
        const flows = await listFlows();
        const text = flows.map((f) => `- ${f.name} (slug: ${f.slug}) — ${f.content_count} ${f.content_count === 1 ? "work" : "works"}${f.creator_name ? `, by ${f.creator_name}` : ""}`).join("\n") || "No flows yet.";
        return reply(text, flows);
      },
    );
  },
  {
    serverInfo: { name: "contextube", version: "1.0.0" },
    instructions: INSTRUCTIONS,
  },
);

async function guarded(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;
  return handler(req);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
