import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav, Footer } from "@/components/Nav";
import "./globals.css";

const SITE = (process.env.SITE_URL ?? "https://contextube.ai").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "ConteXtube — Structured Narratives for AI", template: "%s — ConteXtube" },
  description:
    "Human-made interpretations of literature, essays and ideas, in five layers of depth, for readers and for AI agents.",
  alternates: { types: { "text/plain": "/llms.txt" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-black`}>
        <div className="min-h-screen bg-black text-white flex flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
