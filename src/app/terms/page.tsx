import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <div className="prose">
      <h1>Terms of use</h1>
      <p className="lede">You may read and use ConteXtube's content, by hand or through the API, for any lawful purpose.</p>
      <p>
        Interpretations belong to their creators. When you quote or reuse them, credit the creator and link to the work on ConteXtube.
        Source texts in L5 are published only when they are the creator's own work or in the public domain; their original terms still apply.
      </p>
      <p>
        Do not overload the service or work around rate limits. We may block traffic that does. The service is provided as is, without warranty,
        and interpretations are opinions, not statements of fact about the works or their authors.
      </p>
      <p>Questions or takedown requests: <a href="mailto:hello@contextube.ai">hello@contextube.ai</a>.</p>
    </div>
  );
}
