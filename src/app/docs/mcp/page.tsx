import type { Metadata } from "next";
import { siteUrl } from "@/lib/http";

export const metadata: Metadata = { title: "MCP server" };

const TOOLS: [string, string][] = [
  ["search_content", "Find works by topic, keyword or concept. Start here."],
  ["get_content", "One work's overview, layer statistics and essence."],
  ["get_layer", "All chunks of one layer. Read layer 1 first."],
  ["assemble_context", "The best chunks of one work within a token budget, optionally focused."],
  ["list_content", "Browse every work, with filters."],
  ["list_flows", "Creators' collections."],
];

export default function McpPage() {
  const url = `${siteUrl()}/api/mcp`;
  return (
    <div className="prose">
      <h1>MCP server</h1>
      <p className="lede">
        ConteXtube runs a Model Context Protocol server at <code>{url}</code> over Streamable HTTP. It needs no key and returns the same data as the REST API.
      </p>

      <h2>Claude</h2>
      <p>In Claude, add a custom connector with this URL. In Claude Desktop's config file, add:</p>
      <pre><code>{`{
  "mcpServers": {
    "contextube": { "url": "${url}" }
  }
}`}</code></pre>
      <p className="small muted">
        Windows: <code>%APPDATA%\Claude\claude_desktop_config.json</code>. macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>.
      </p>

      <h2>Other clients</h2>
      <p>
        Any client that supports remote MCP servers over HTTP can connect to the same URL. For clients that only speak stdio, use a bridge such as
        <code> npx mcp-remote {url}</code>.
      </p>

      <h2>Tools</h2>
      <div className="table-scroll">
        <table className="endpoints">
          <thead><tr><th>Tool</th><th>What it does</th></tr></thead>
          <tbody>{TOOLS.map(([t, d]) => <tr key={t}><td><code>{t}</code></td><td>{d}</td></tr>)}</tbody>
        </table>
      </div>
      <p>
        Agents work best in this order: search, then <code>get_content</code>, then layer 1, then deeper layers or
        <code> assemble_context</code> when a task needs a fixed budget.
      </p>
    </div>
  );
}
