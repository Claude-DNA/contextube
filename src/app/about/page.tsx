import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <div className="prose">
      <h1>About ConteXtube</h1>
      <p className="lede">
        Most writing is made for people to read from start to finish. AI systems read differently: they need to know what a work means, quickly,
        and at the depth a task calls for. ConteXtube is a library of that meaning, written by people.
      </p>

      <h2>Fabricando fabricamur</h2>
      <p>
        By creating, we shape ourselves. Interpreting a work changes how you understand it, and every interpretation an AI reads changes how it answers
        the next person. ConteXtube treats that act of interpretation, Context Creation, as creative work in its own right.
      </p>

      <h2>What it is not</h2>
      <p>
        It is not a search engine: it does not index the web, it hosts original interpretations. It is not a wiki: each work carries a creator's voice and
        editorial view, not a neutral summary. And it is not a chatbot: it supplies context to chatbots, so they answer from structure instead of guesswork.
      </p>

      <h2>Who makes it</h2>
      <p>
        ConteXtube was started in Vancouver by the writer Andrei Navrotskii, working with Claude. The first works in the
        library are his own essays and stories, alongside works in the public domain.
      </p>

      <p><Link href="/how-it-works">See how the five layers work</Link>, or <Link href="/docs">read the developer docs</Link>.</p>
    </div>
  );
}
