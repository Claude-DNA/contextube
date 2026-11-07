import type { Metadata } from "next";
import { Page } from "@/components/Page";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <Page title="Privacy" lead="ConteXtube has no accounts and sets no tracking cookies.">
      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          To keep the service running and to limit abuse, our hosting provider records standard request logs, including IP addresses, for a short
          period. We use IP addresses only to apply rate limits. We do not sell or share them.
        </p>
        <p>
          Works in the library are published deliberately by their creators and are public. Text sent to the API, such as search queries and focus
          terms, is used to answer the request and is not stored with your identity.
        </p>
        <p>Questions: <a href="mailto:hello@contextube.ai" className="text-blue-400 hover:underline">hello@contextube.ai</a>.</p>
      </div>
    </Page>
  );
}
