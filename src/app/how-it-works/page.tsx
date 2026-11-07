import type { Metadata } from "next";
import { LAYERS, EXTRACT_SYMBOLS } from "@/lib/layers";
import { Page, Section, Table } from "@/components/Page";
import { Extract } from "@/components/Extract";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorks() {
  return (
    <Page
      title="How It Works"
      lead="A person reads a work closely and writes down what it means, at five depths. Readers can stop at the surface or go all the way down. AI agents take exactly as much as their task needs."
    >
      <Section title="Five layers">
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
        <p className="text-center text-gray-500 text-sm">← Quick understanding · · · Deep knowledge →</p>
        <p>
          Every chunk stands on its own. Evidence in L2 always carries a quote from the source, so an interpretation can be checked against the text.
          For works still under copyright, L5 holds notes instead of the text, with a link to buy the book.
        </p>
      </Section>

      <Section title="Symbolic extracts">
        <p>
          Each chunk opens with an extract: two to eight words that compress the idea into a formula. It is the fastest way to tell what a chunk is
          about, and agents use extracts as index keys.
        </p>
        <Table
          head={["Symbol", "Meaning", "Example"]}
          rows={EXTRACT_SYMBOLS.map((s) => [
            <span key="s" className="text-blue-400 text-lg font-semibold">{s.symbol}</span>,
            s.meaning,
            <Extract key="e" text={s.example} className="extract text-blue-400 font-semibold uppercase text-xs tracking-wide" />,
          ])}
        />
      </Section>

      <Section title="Context Creation">
        <p>
          The interpretation is the work. A Context Creator brings taste, lived experience and judgment about what matters; AI helps with breadth,
          pattern-finding and structure. ConteXtube publishes the result under the creator&apos;s name.
        </p>
      </Section>
    </Page>
  );
}
