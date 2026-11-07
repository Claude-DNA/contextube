import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/http";

export const metadata: Metadata = { title: "API for developers" };

const ENDPOINTS: [string, string, string][] = [
  ["GET", "/content", "Published works, newest first. Filters: flow, tag, domain, language, limit (≤100), offset."],
  ["GET", "/content/{id}", "One work with per-layer counts and its top essence. {id} is the uuid or the slug."],
  ["GET", "/content/{id}/layer/{n}", "All chunks of layer 1 to 5, in reading order."],
  ["GET", "/search?q=", "Works ranked by relevance, each with its best-matching chunks."],
  ["POST", "/assemble", "The best chunks of one work that fit a token budget."],
  ["GET", "/feed", "L1 chunks across the library, newest works first."],
  ["GET", "/flows", "Creators' collections with work counts."],
  ["GET", "/categories", "Domains and tags with counts."],
  ["POST", "/publish", "Writers only. Publish or replace a work. Needs a publish key."],
  ["DELETE", "/publish/{slug}", "Writers only. Unpublish a work; nothing is deleted."],
];

export default function DocsPage() {
  const site = siteUrl();
  return (
    <div className="prose">
      <h1>API for developers</h1>
      <p className="lede">
        Every work is available to programs at {site}/api/v1. Reading needs no key and allows 60 requests a minute per IP.
        The full contract is in <a href="/openapi.json">openapi.json</a>; a summary for language models is in <a href="/llms.txt">llms.txt</a>.
      </p>

      <h2>Endpoints</h2>
      <div className="table-scroll">
        <table className="endpoints">
          <thead><tr><th>Method</th><th>Path</th><th>What it returns</th></tr></thead>
          <tbody>
            {ENDPOINTS.map(([m, p, d]) => (
              <tr key={m + p}><td>{m}</td><td><code>{p}</code></td><td>{d}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Read a work in three calls</h2>
      <pre><code>{`curl "${site}/api/v1/search?q=partnership"
curl "${site}/api/v1/content/peace-treaty-architecture"
curl "${site}/api/v1/content/peace-treaty-architecture/layer/1"`}</code></pre>

      <h2>Assemble context to a budget</h2>
      <p>
        Send a work and a token budget; ConteXtube returns its most important chunks that fit, always opening with the work's essence.
        With <code>focus</code>, chunks that match those concepts rise. <code>maxLayer</code> caps the depth (default 3).
      </p>
      <pre><code>{`curl -X POST "${site}/api/v1/assemble" \\
  -H "Content-Type: application/json" \\
  -d '{"contentId": "peace-treaty-architecture", "maxTokens": 1500, "focus": ["privacy"]}'`}</code></pre>
      <p>
        Strategies: <code>relevant</code> (default) ranks by importance and focus; <code>complete</code> fills layer by layer from L1;
        <code>custom</code> returns the <code>chunkIds</code> you name. The response ends with <code>usage</code>: tokens used, budget and chunks left out.
      </p>

      <h2>Publish a work</h2>
      <p>
        Writers send the whole unit as JSON with <code>Authorization: Bearer &lt;publish key&gt;</code>. Sending the same slug again replaces every chunk.
        The server counts tokens. Validation rejects the whole unit if a layer is outside 1 to 5, an extract runs past 8 words,
        an L2 chunk has no <code>source_quote</code>, or a copyrighted work carries L5 source text.
      </p>
      <pre><code>{`{
  "flow": "andrei-navrotskii",
  "slug": "echo",
  "title": "Shards: Echo",
  "language": "en",
  "rights": "own",
  "tags": ["space", "war"],
  "domains": ["literature"],
  "chunks": [
    { "layer": 1, "extract": "silence∞human echo", "text": "...", "importance": 0.9 },
    { "layer": 2, "extract": "…", "text": "...", "source_quote": "..." }
  ]
}`}</code></pre>

      <h2>Agents</h2>
      <p>Assistants that speak MCP can use the library directly. <Link href="/docs/mcp">Set up the MCP server</Link>.</p>
    </div>
  );
}
