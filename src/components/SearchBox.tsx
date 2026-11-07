"use client";

import { useEffect, useState } from "react";

type Hit = { content: { id: string; slug: string; title: string; description: string } };

/** The original live search: results drop down as you type; Enter goes to Explore. Works as a plain form without JS. */
export function SearchBox({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState(initial);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim() || q === initial) {
      setHits(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&limit=8`);
        const d = await r.json();
        setHits(d.results ?? []);
      } catch {
        setHits(null);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, initial]);

  return (
    <form action="/explore" role="search" className="relative max-w-xl mx-auto pt-2">
      <label htmlFor="site-search" className="sr-only">Search ideas</label>
      <div className="absolute inset-y-0 left-0 pl-4 pt-2 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        id="site-search"
        name="q"
        type="search"
        value={q}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setHits(null)}
        placeholder="Search ideas..."
        className="w-full pl-10 pr-4 py-2.5 bg-gray-900/80 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
      />
      {loading && (
        <div className="absolute inset-y-0 right-0 pr-4 pt-2 flex items-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hits && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-40 text-left">
          {hits.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No results. Try fewer or broader words.</div>
          ) : (
            hits.map((h) => (
              <a
                key={h.content.id}
                href={`/content/${h.content.slug}`}
                className="block px-4 py-2.5 hover:bg-gray-800 border-b border-gray-800/50 last:border-0 transition-colors"
              >
                <div className="font-medium text-sm">{h.content.title}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{h.content.description}</div>
              </a>
            ))
          )}
          <a
            href={`/explore?q=${encodeURIComponent(q)}`}
            className="block px-4 py-2 text-center text-blue-400 text-xs border-t border-gray-800"
          >
            View all in Explore →
          </a>
        </div>
      )}
    </form>
  );
}
