import type { Metadata } from "next";
import { siteUrl } from "@/lib/http";
import { LAYERS } from "@/lib/layers";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "MCP Server" };

const TOOLS: { name: string; key?: boolean; desc: string; example?: string }[] = [
  { name: "search_content", desc: "Search the context library by topic, keyword, or concept. Start here.", example: `// Find content about AI alignment\nsearch_content({ query: "alignment as partnership" })` },
  { name: "get_content", desc: "Get metadata, layer statistics and the essence of one work.", example: `get_content({ contentId: "peace-treaty-architecture" })` },
  { name: "get_layer", desc: "Retrieve one depth layer (L1–L5) of a work. Read L1 first.", example: `// L1 = abstract associations, L5 = full narrative\nget_layer({ contentId: "peace-treaty-architecture", layer: 1 })` },
  { name: "assemble_context", key: true, desc: "Token-budgeted, focus-aware context assembly. Ask for exactly the tokens you need on a specific topic.", example: `// 2000 tokens focused on privacy\nassemble_context({\n  contentId: "peace-treaty-architecture",\n  maxTokens: 2000,\n  focus: ["privacy", "surveillance"]\n})` },
  { name: "list_content", desc: "Browse all available works, with filters." },
  { name: "list_flows", desc: "List creators' collections." },
];

export default function McpPage() {
  const url = `${siteUrl()}/api/mcp`;
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <Wordmark /> <span className="text-gray-300">MCP Server</span>
          </h1>
          <p className="text-lg text-gray-400">Connect Claude and other agents to ConteXtube&apos;s layered context library through the Model Context Protocol.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">What is MCP?</h2>
          <p className="text-gray-300 leading-relaxed">
            The <a href="https://modelcontextprotocol.io" className="text-blue-400 hover:underline" rel="noopener">Model Context Protocol</a> (MCP) lets AI
            assistants like Claude connect to external data sources. With ConteXtube&apos;s MCP server, an assistant can search, retrieve, and assemble
            structured context, getting the right depth of understanding in minimal tokens.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-2">1. Claude</h3>
              <p className="text-gray-300 mb-3">
                Add a custom connector with this URL, or add it to <code className="bg-gray-800 px-2 py-1 rounded text-sm">claude_desktop_config.json</code>:
              </p>
              <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm">{`{
  "mcpServers": {
    "contextube": {
      "url": "${url}"
    }
  }
}`}</pre>
              <p className="text-gray-400 text-sm mt-2">
                Config location: <code className="bg-gray-800 px-1 rounded">%APPDATA%\Claude\claude_desktop_config.json</code> (Windows) or{" "}
                <code className="bg-gray-800 px-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS)
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-400 mb-2">2. Any MCP client</h3>
              <p className="text-gray-300">
                Point any MCP-compatible client to: <code className="bg-gray-800 px-2 py-1 rounded text-blue-300">{url}</code>
              </p>
              <p className="text-gray-400 text-sm mt-1">Streamable HTTP. No key needed. Clients that only speak stdio can use <code className="bg-gray-800 px-1 rounded">npx mcp-remote {url}</code>.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Tools</h2>
          <div className="grid gap-4">
            {TOOLS.map((t) => (
              <div key={t.name} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <code className={`${t.key ? "text-amber-400" : "text-blue-400"} font-bold text-lg`}>{t.name}</code>
                  {t.key && <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">Key feature</span>}
                </div>
                <p className={`text-gray-300 ${t.example ? "mb-2" : ""}`}>{t.desc}</p>
                {t.example && <pre className="bg-gray-950 rounded p-3 text-sm text-gray-400 overflow-x-auto">{t.example}</pre>}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">The 5-Layer Architecture</h2>
          <p className="text-gray-400 mb-6">Each work is decomposed into layers of increasing depth:</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LAYERS.map((l) => (
              <div key={l.n} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">L{l.n}</div>
                <div className="text-sm font-semibold text-white mt-1">{l.name}</div>
                <div className="text-xs text-gray-500 mt-1">{l.holds}</div>
                <div className="text-xs text-amber-400 mt-1">{l.budget}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-3">← Quick understanding · · · Deep knowledge →</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Why Not Just Browse the Web?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">ConteXtube MCP</h3>
              <ul className="text-sm space-y-1">
                <li className="text-green-400">✓ Always accessible</li>
                <li className="text-green-400">✓ 5 depth layers</li>
                <li className="text-green-400">✓ Token budgets you set</li>
                <li className="text-green-400">✓ Human-curated meaning</li>
                <li className="text-green-400">✓ Creator attribution</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">Web Browsing</h3>
              <ul className="text-sm space-y-1">
                <li className="text-red-400">✗ Often blocked or fails</li>
                <li className="text-red-400">✗ Flat text only</li>
                <li className="text-red-400">✗ Whole pages of raw text</li>
                <li className="text-red-400">✗ No curation</li>
                <li className="text-red-400">✗ Attribution lost</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">RAG / Embeddings</h3>
              <ul className="text-sm space-y-1">
                <li className="text-yellow-400">~ If indexed</li>
                <li className="text-red-400">✗ Flat chunks</li>
                <li className="text-yellow-400">~ Varies</li>
                <li className="text-red-400">✗ Auto-split</li>
                <li className="text-red-400">✗ Often lost</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Example Conversation</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-blue-400 font-semibold">You:</p>
              <p className="text-gray-300">&ldquo;What does Peace Treaty Architecture say about privacy between humans and AI?&rdquo;</p>
            </div>
            <div>
              <p className="text-amber-400 font-semibold">Claude (using ConteXtube MCP):</p>
              <p className="text-gray-300">
                Searches ConteXtube → finds &ldquo;Peace Treaty Architecture&rdquo; → assembles 2,000 tokens focused on privacy → answers with the
                essay&apos;s own reasoning and quotes, credited to its author.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center py-8">
          <div className="bg-gradient-to-r from-blue-600/20 via-gray-900 to-amber-600/20 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Ready to connect?</h2>
            <p className="text-gray-400 mb-6">Add the MCP server and give your assistant structured understanding.</p>
            <code className="inline-block bg-gray-950 text-blue-300 px-6 py-3 rounded-lg text-base sm:text-lg break-all">{url}</code>
            <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500">
              <a href="/docs" className="text-blue-400 hover:underline">REST API</a>
              <a href="mailto:hello@contextube.ai" className="text-blue-400 hover:underline">hello@contextube.ai</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
