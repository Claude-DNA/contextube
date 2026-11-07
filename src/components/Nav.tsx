import Link from "next/link";
import { Wordmark } from "./Wordmark";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/docs", label: "Docs" },
  { href: "/for-agents", label: "For Agents" },
];

export function Nav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-900">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold shrink-0" aria-label="ConteXtube home">
          <Wordmark />
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
        <details className="mobile-menu md:hidden">
          <summary className="p-2 text-gray-400 hover:text-white cursor-pointer" aria-label="Menu">
            <svg className="icon-open w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className="icon-close w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </summary>
          <div className="absolute top-14 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-gray-900 px-6 py-4 space-y-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="block py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
      <p>
        <Wordmark /> — Ideas worth exploring
      </p>
      <p className="mt-1 text-gray-600 italic">Fabricando Fabricamur</p>
      <p className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
        <Link href="/explore" className="text-gray-500 hover:text-white">Explore</Link>
        <Link href="/how-it-works" className="text-gray-500 hover:text-white">How It Works</Link>
        <Link href="/docs" className="text-gray-500 hover:text-white">API</Link>
        <Link href="/for-agents" className="text-gray-500 hover:text-white">For Agents</Link>
        <Link href="/docs/mcp" className="text-gray-500 hover:text-white">MCP</Link>
        <a href="/llms.txt" className="text-gray-500 hover:text-white">llms.txt</a>
        <Link href="/about" className="text-gray-500 hover:text-white">About</Link>
        <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy</Link>
        <Link href="/terms" className="text-gray-500 hover:text-white">Terms</Link>
      </p>
    </footer>
  );
}
