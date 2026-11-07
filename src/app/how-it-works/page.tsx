import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LAYERS, EXTRACT_SYMBOLS } from "@/lib/layers";
import { Page, Section, Table } from "@/components/Page";
import { Extract } from "@/components/Extract";

export const metadata: Metadata = { title: "How It Works" };

/** Worked example from the ConteXtube manual. The L2 quote is David Wyllie's translation (Project Gutenberg #7849). */
const TRIAL: Record<number, ReactNode> = {
  1: <Extract text="suffocation∞guilt.without.source" className="extract text-blue-400 font-semibold uppercase text-xs tracking-wide" />,
  2: (
    <>
      Guilt arrives before any charge does: K. is arrested first and spends the rest of the book looking for the crime.
      <span className="block text-gray-500 italic mt-2">
        “Someone must have been telling lies about Josef K., he knew he had done nothing wrong but, one morning, he was arrested.”
      </span>
    </>
  ),
  3: <>Kafka&apos;s court ↔ modern social media tribunals. <em>The Trial</em> ↔ Dostoevsky&apos;s Grand Inquisitor: authority that needs no evidence.</>,
  4: <>The Trial is not about law. It is about how systems replace guilt with procedure until the person disappears. The horror is that K. cooperates.</>,
  5: <>The full text of the novel, linked to every idea above, with a note on how this reading took shape.</>,
};

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

      <Section title="One work at five depths">
        <p>Kafka&apos;s <em>The Trial</em>, read layer by layer.</p>
        <ol className="space-y-4">
          {LAYERS.map((l) => (
            <li key={l.n} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-white">
                <span className="text-blue-400 mr-2">L{l.n}</span>
                {l.name}
                <span className="text-amber-400 text-xs font-normal ml-2">{l.budget}</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{l.detail}</p>
              <div className="text-gray-200 text-sm leading-relaxed border-l-2 border-gray-700 pl-3">{TRIAL[l.n]}</div>
            </li>
          ))}
        </ol>
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
