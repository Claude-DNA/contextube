import type { Metadata } from "next";
import { Page } from "@/components/Page";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <Page title="Terms of Use" lead="You may read and use ConteXtube's content, by hand or through the API, for any lawful purpose.">
      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          Interpretations belong to their creators. When you quote or reuse them, credit the creator and link to the work on ConteXtube. Source texts
          in L5 are published only when they are the creator&apos;s own work or in the public domain; their original terms still apply.
        </p>
        <p>
          Do not overload the service or work around rate limits. We may block traffic that does. The service is provided as is, without warranty,
          and interpretations are opinions, not statements of fact about the works or their authors.
        </p>
        <p>Questions or takedown requests: <a href="mailto:hello@contextube.ai" className="text-blue-400 hover:underline">hello@contextube.ai</a>.</p>
      </div>
    </Page>
  );
}
