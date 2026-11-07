import Link from "next/link";
import type { Metadata } from "next";
import { Page, Section, Pre, Code, Table } from "@/components/Page";
import { siteUrl } from "@/lib/http";
import { getTokenProfiles, type TokenProfile } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "For Agents",
  description: "Connect Claude, ChatGPT, Gemini or any agent to ConteXtube's layered context library. No key needed.",
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default async function ForAgents() {
  const site = siteUrl();
  let profiles: TokenProfile[] = [];
  try {
    profiles = await getTokenProfiles();
  } catch {
    profiles = [];
  }
  const example = profiles.find((p) => p.source > 0)?.slug ?? "the-metamorphosis";

  const doors = [
    {
      name: "Claude and other MCP clients",
      accent: "text-blue-400",
      body: (
        <>
          Add ConteXtube as a remote MCP server at <Code>{site}/api/mcp</Code>. Six tools: search, browse, read a work, read one layer, assemble to a
          budget and list collections. Setup for Claude Desktop and stdio-only clients is in the <Link href="/docs/mcp" className="text-blue-400 hover:underline">MCP docs</Link>.
        </>
      ),
    },
    {
      name: "ChatGPT",
      accent: "text-amber-400",
      body: (
        <>
          In a custom GPT, add an Action and import the schema from <Code>{site}/openapi.json</Code>. No authentication. The GPT can then search the
          library, read any layer and assemble context to a token budget.
        </>
      ),
    },
    {
      name: "Gemini and other models",
      accent: "text-blue-400",
      body: (
        <>
          Give the model <Code>{site}/llms.txt</Code>: a plain-text guide to the API with the full catalog. Agents that support function calling can use
          the same <a href="/openapi.json" className="text-blue-400 hover:underline">OpenAPI schema</a> as ChatGPT.
        </>
      ),
    },
    {
      name: "Any HTTP client",
      accent: "text-amber-400",
      body: (
        <>
          A REST API at <Code>{site}/api/v1</Code> returning JSON. Reading is free and open, 60 requests a minute per IP. See the{" "}
          <Link href="/docs" className="text-blue-400 hover:underline">API docs</Link>.
        </>
      ),
    },
  ];

  return (
    <Page
      title="For Agents"
      lead="Agents waste most of their context on raw text. ConteXtube gives them a person's reading of a work, split into five depths, so an agent takes exactly as much as its task needs, attributed to the person who wrote it."
    >
      <Section title="Four ways to connect">
        <div className="grid sm:grid-cols-2 gap-4">
          {doors.map((d) => (
            <div key={d.name} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <h3 className={`font-semibold mb-2 ${d.accent}`}>{d.name}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {profiles.length > 0 && (
        <Section title="What a work costs in tokens">
          <p>Measured from the library as it stands now. An agent can check whether a work is relevant for the price of its first layer.</p>
          <Table
            head={["Work", "Overview (L1)", "Ideas and evidence (L1–L2)", "Full source (L5)", "Everything"]}
            rows={profiles.map((p) => [
              <Link key="t" href={`/content/${p.slug}`} className="text-blue-400 hover:underline">{p.title}</Link>,
              fmt(p.overview),
              fmt(p.evidence),
              p.source > 0 ? fmt(p.source) : <span key="n" className="text-gray-600">notes only</span>,
              fmt(p.total),
            ])}
          />
        </Section>
      )}

      <Section title="Ask for a budget, get a budget">
        <p>
          <Code>assemble</Code> picks the most relevant chunks across all five layers for a focus you name and stops at your token limit. It always
          keeps the work&apos;s top essence, and it reports what it left out.
        </p>
        <Pre>{`curl -s ${site}/api/v1/assemble \\
  -H "Content-Type: application/json" \\
  -d '{"contentId": "${example}", "maxTokens": 1500, "focus": "family"}'`}</Pre>
        <p className="text-sm text-gray-500">
          The answer includes <Code>usage</Code>: tokens used, the budget, and how many chunks were returned or left out.
        </p>
      </Section>

      <Section title="Rules agents can rely on">
        <ul className="list-disc pl-5 space-y-2">
          <li>Every L2 idea carries a quote from the source, so claims can be checked against the text.</li>
          <li>Every work names its creator. Credit them when you use their interpretation.</li>
          <li>Full source text appears only for the creator&apos;s own work or the public domain. Copyrighted works link to where they can be bought.</li>
          <li>Chunks stand on their own: any one can be used without the others.</li>
        </ul>
      </Section>
    </Page>
  );
}
