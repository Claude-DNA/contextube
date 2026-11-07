import Link from "next/link";
import type { Metadata } from "next";
import { Page, Section } from "@/components/Page";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <Page
      title={<>About <Wordmark /></>}
      lead="Most writing is made for people to read from start to finish. AI systems read differently: they need to know what a work means, quickly, and at the depth a task calls for. ConteXtube is a library of that meaning, written by people."
    >
      <Section title="Fabricando fabricamur">
        <p>
          By creating, we shape ourselves. Interpreting a work changes how you understand it, and every interpretation an AI reads changes how it
          answers the next person. ConteXtube treats that act of interpretation, Context Creation, as creative work in its own right.
        </p>
      </Section>

      <Section title="What it is not">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            ["Not a search engine", "It does not index the web. It hosts original interpretations."],
            ["Not a wiki", "Each work carries a creator's voice and editorial view, not a neutral summary."],
            ["Not a chatbot", "It supplies context to chatbots, so they answer from structure instead of guesswork."],
          ].map(([h, p]) => (
            <div key={h} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">{h}</h3>
              <p className="text-sm text-gray-400">{p}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Who makes it">
        <p>
          ConteXtube was started in Vancouver by the writer Andrei Navrotskii, working with Claude. The first works in the library are his own essays
          and stories, alongside works in the public domain.
        </p>
      </Section>

      <p>
        <Link href="/how-it-works" className="text-amber-400 hover:text-amber-300 font-medium">See how the five layers work →</Link>
      </p>
    </Page>
  );
}
