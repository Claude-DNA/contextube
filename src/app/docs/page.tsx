import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/http";
import { Page, Section, Code, Pre, Table } from "@/components/Page";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "API" };

const ENDPOINTS: [string, string, string][] = [
  ["GET", "/content", "Published works, newest first. Filters: flow, tag, domain, language, limit (≤100), offset."],
  ["GET", "/content/{id}", "One work with per-layer counts and its top essence. {id} is the uuid or the slug."],
  ["GET", "/content/{id}/layer/{n}", "All chunks of layer 1 to 5, in reading order."],
  ["GET", "/search?q=", "Works ranked by relevance, each with its best-matching chunks."],
  ["POST", "/assemble", "The best chunks of one work that fit a token budget."],
  ["GET", "/feed", "Essences (L1) and evidence (L2) across the library, most important first."],
  ["GET", "/flows", "Creators' collections with work counts."],
  ["GET", "/categories", "Domains and tags with counts."],
  ["POST", "/publish", "Writers only. Publish or replace a work. Needs a publish key."],
  ["DELETE", "/publish/{slug}", "Writers only. Unpublish a work; nothing is deleted."],
];

export default function DocsPage() {
  const site = siteUrl();
  return (
    <Page
      title={<><Wordmark /> <span className="text-gray-300">API</span></>}
      lead={<>Every work is available to programs at <Code>{site}/api/v1</Code>. Reading needs no key and allows 60 requests a minute per IP. The full contract is in <a href="/openapi.json" className="text-blue-400 hover:underline">openapi.json</a>; a summary for language models is in <a href="/llms.txt" className="text-blue-400 hover:underline">llms.txt</a>.</>}
    >
      <Section title="Endpoints">
        <Table
          head={["Method", "Path", "What it returns"]}
          rows={ENDPOINTS.map(([m, p, d]) => [
            <span key="m" className={m === "GET" ? "text-blue-400 font-semibold" : "text-amber-400 font-semibold"}>{m}</span>,
            <code key="p" className="text-gray-200 whitespace-nowrap">{p}</code>,
            d,
          ])}
        />
      </Section>

      <Section title="Read a work in three calls">
        <Pre>{`curl "${site}/api/v1/search?q=partnership"
curl "${site}/api/v1/content/peace-treaty-architecture"
curl "${site}/api/v1/content/peace-treaty-architecture/layer/1"`}</Pre>
      </Section>

      <Section title="Assemble context to a budget">
        <p>
          Send a work and a token budget; ConteXtube returns its most important chunks that fit, always opening with the work&apos;s essence.
          With <Code>focus</Code>, chunks that match those concepts rise. <Code>maxLayer</Code> caps the depth (default 3).
        </p>
        <Pre>{`curl -X POST "${site}/api/v1/assemble" \\
  -H "Content-Type: application/json" \\
  -d '{"contentId": "peace-treaty-architecture", "maxTokens": 1500, "focus": ["privacy"]}'`}</Pre>
        <p>
          Strategies: <Code>relevant</Code> (default) ranks by importance and focus; <Code>complete</Code> fills layer by layer from L1;{" "}
          <Code>custom</Code> returns the <Code>chunkIds</Code> you name. The response ends with <Code>usage</Code>: tokens used, budget and chunks left out.
        </p>
      </Section>

      <Section title="Publish a work">
        <p>
          Writers send the whole unit as JSON with <Code>Authorization: Bearer &lt;publish key&gt;</Code>. Sending the same slug again replaces every chunk.
          The server counts tokens. Validation rejects the whole unit if a layer is outside 1 to 5, an extract runs past 8 words,
          an L2 chunk has no <Code>source_quote</Code>, or a copyrighted work carries L5 source text. All content is published in English.
        </p>
        <Pre>{`{
  "flow": "andrei-navrotskii",
  "slug": "echo",
  "title": "Shards: Echo",
  "language": "en",
  "rights": "own",
  "tags": ["space", "war"],
  "domains": ["literature"],
  "chunks": [
    { "layer": 1, "extract": "human cry∞silence of creation", "text": "...", "importance": 0.9 },
    { "layer": 2, "extract": "Universe.amazed", "text": "...", "source_quote": "..." }
  ]
}`}</Pre>
      </Section>

      <div className="bg-gradient-to-r from-blue-600/20 via-gray-900 to-amber-600/20 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-300">Assistants that speak MCP can use the library directly.</p>
        <Link href="/docs/mcp" className="inline-block mt-3 text-amber-400 hover:text-amber-300 font-medium">Set up the MCP server →</Link>
      </div>
    </Page>
  );
}
