import type { Metadata } from "next";
import { LAYERS, EXTRACT_SYMBOLS } from "@/lib/layers";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorks() {
  return (
    <div className="prose">
      <h1>How it works</h1>
      <p className="lede">
        A person reads a work closely and writes down what it means, at five depths. Readers can stop at the surface or go all the way down.
        AI agents can take exactly as much as their task needs.
      </p>

      <h2>Five layers</h2>
      <div className="table-scroll">
        <table className="endpoints layer-table">
          <thead><tr><th>Layer</th><th>What it holds</th><th>Size per chunk</th></tr></thead>
          <tbody>
            {LAYERS.map((l) => (
              <tr key={l.n}>
                <td><span className={`layer-swatch bar l${l.n}`} aria-hidden="true" />L{l.n} {l.name}</td>
                <td>{l.holds}</td>
                <td>{l.budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Every chunk stands on its own. Evidence in L2 always carries a quote from the source, so an interpretation can be checked against the text.
        For works still under copyright, L5 holds notes instead of the text, with a link to buy the book.
      </p>

      <h2>Symbolic extracts</h2>
      <p>
        Each chunk opens with an extract: two to eight words that compress the idea into a formula. It is the fastest way to tell what a chunk is about,
        and agents use extracts as index keys.
      </p>
      <div className="table-scroll">
        <table className="endpoints">
          <thead><tr><th>Symbol</th><th>Meaning</th><th>Example</th></tr></thead>
          <tbody>
            {EXTRACT_SYMBOLS.map((s) => (
              <tr key={s.symbol}><td className="extract">{s.symbol}</td><td>{s.meaning}</td><td className="extract">{s.example}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Context Creation</h2>
      <p>
        The interpretation is the work. A Context Creator brings taste, lived experience and judgment about what matters; AI helps with breadth,
        pattern-finding and structure. ConteXtube publishes the result under the creator's name.
      </p>
    </div>
  );
}
