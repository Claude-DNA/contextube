import Link from "next/link";
import type { Metadata } from "next";
import { listContent, listCategories, searchContent } from "@/lib/content";
import { SearchBox } from "@/components/SearchBox";
import { Extract } from "@/components/Extract";

export const metadata: Metadata = { title: "Explore" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; tag?: string; domain?: string }> };

const pill = (active: boolean, kind: "domain" | "tag") =>
  `text-xs px-2.5 py-1 rounded-full border transition-colors ${
    active
      ? "bg-blue-600 text-white border-blue-500"
      : kind === "domain"
        ? "bg-blue-900/40 text-blue-300 border-blue-800 hover:border-blue-500"
        : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500"
  }`;

export default async function ExplorePage({ searchParams }: Props) {
  const { q, tag, domain } = await searchParams;
  const [categories, hits, list] = await Promise.all([
    listCategories(),
    q ? searchContent(q, 25) : Promise.resolve(null),
    q ? Promise.resolve(null) : listContent({ tag, domain, limit: 100 }),
  ]);

  const heading = q ? `Results for “${q}”` : domain ? `Domain: ${domain}` : tag ? `Tag: ${tag}` : "All works";

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Explore</h1>
        <p className="text-gray-400 text-sm">Every work, read at five depths.</p>
        <SearchBox initial={q ?? ""} />
      </div>

      <div className="space-y-4 mb-10">
        {categories.domains.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Domains">
            {categories.domains.map((d) => (
              <li key={d.name}>
                <Link href={`/explore?domain=${encodeURIComponent(d.name)}`} className={pill(domain === d.name, "domain")}>
                  {d.name} <span className="opacity-60">{d.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {categories.tags.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Tags">
            {categories.tags.map((t) => (
              <li key={t.name}>
                <Link href={`/explore?tag=${encodeURIComponent(t.name)}`} className={pill(tag === t.name, "tag")}>
                  {t.name} <span className="opacity-60">{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-4 mb-4 border-b border-gray-800 pb-3">
        <h2 className="text-xl font-bold">{heading}</h2>
        {(q || tag || domain) && <Link href="/explore" className="text-sm text-blue-400 hover:text-blue-300">Show all works</Link>}
      </div>

      {hits && (hits.length === 0 ? (
        <p className="text-center text-gray-500 py-20">Nothing matched. Try fewer or broader words.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hits.map((h) => (
            <Link key={h.content.id} href={`/content/${h.content.slug}`} lang={h.content.language}
              className="block bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3 hover:border-gray-600 transition-all">
              <h3 className="font-bold text-lg text-white">{h.content.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-3">{h.content.description}</p>
              {h.matches.slice(0, 2).map((m) => (
                <p key={m.id} className="text-sm text-gray-300 border-l-2 border-gray-700 pl-3">
                  <span className="text-xs text-amber-400 mr-1">L{m.layer}</span>
                  {m.extract ? <Extract text={m.extract} className="extract text-blue-400 font-semibold" /> : m.text.slice(0, 140)}
                </p>
              ))}
              <p className="text-xs text-blue-400 pt-2 border-t border-gray-800/50">Explore →</p>
            </Link>
          ))}
        </div>
      ))}

      {list && (list.content.length === 0 ? (
        <p className="text-center text-gray-500 py-20">No works here yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.content.map((u) => (
            <Link key={u.id} href={`/content/${u.slug}`} lang={u.language}
              className="flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3 hover:border-gray-600 transition-all">
              <h3 className="font-bold text-lg text-white">{u.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-3 flex-1">{u.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-800/50 text-xs" lang="en">
                <span className="text-gray-500">{u.source_author ?? u.flow_name} · <span className="text-amber-400">{u.total_tokens.toLocaleString("en")}</span> tokens</span>
                <span className="text-blue-400">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
