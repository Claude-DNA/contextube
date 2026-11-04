import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const SITE = (process.env.SITE_URL ?? "https://contextube.ai").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "ConteXtube — Structured narratives for AI", template: "%s — ConteXtube" },
  description:
    "Human-made interpretations of literature, essays and ideas, in five layers of depth, for readers and for AI agents.",
  alternates: { types: { "text/plain": "/llms.txt" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="wordmark" aria-label="ConteXtube home">
              Conte<span>X</span>tube
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/">Feed</Link>
              <Link href="/explore">Explore</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/docs">For developers</Link>
              <Link href="/about">About</Link>
            </nav>
          </div>
        </header>
        <main>
          <div className="wrap">{children}</div>
        </main>
        <footer className="site-footer">
          <div className="wrap">
            <p className="motto">Fabricando fabricamur. By creating, we shape ourselves.</p>
            <nav aria-label="Footer">
              <Link href="/docs">API</Link>
              <Link href="/docs/mcp">MCP</Link>
              <a href="/llms.txt">llms.txt</a>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
