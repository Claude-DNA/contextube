import Link from "next/link";
import { Extract } from "@/components/Extract";
import type { Metadata } from "next";
import { listContent, listCategories, searchContent } from "@/lib/content";

export const metadata: Metadata = { title: "Explore" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; tag?: string; domain?: string }> };

export default async function ExplorePage({ searchParams }: Props) {
  const { q, tag, domain } = await searchParams;
  const [categories, hits, list] = await Promise.all([
    listCategories(),
    q ? searchContent(q, 25) : Promise.resolve(null),
    q ? Promise.resolve(null) : listContent({ tag, domain, limit: 100 }),
  ]);

  const heading = q ? `Results for “${q}”` : domain ? `Domain: ${domain}` : tag ? `Tag: ${tag}` : "All works";

  return (
    <>
      <h1>Explore</h1>
      <form className="search" role="search" action="/explore">
        <label htmlFor="q" className="sr-only">Search the library</label>
        <input id="q" name="q" type="search" defaultValue={q ?? ""} placeholder="Search ideas, works or concepts" />
        <button type="submit">Search</button>
      </form>

      <div className="facets">
        {categories.domains.length > 0 && (
          <div>
            <h2>Domains</h2>
            <ul className="tags">
              {categories.domains.map((d) => (
                <li key={d.name}><Link href={`/explore?domain=${encodeURIComponent(d.name)}`}>{d.name} ({d.count})</Link></li>
              ))}
            </ul>
          </div>
        )}
        {categories.tags.length > 0 && (
          <div>
            <h2>Tags</h2>
            <ul className="tags">
              {categories.tags.map((t) => (
                <li key={t.name}><Link href={`/explore?tag=${encodeURIComponent(t.name)}`}>{t.name} ({t.count})</Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h2>{heading}</h2>
      {(q || tag || domain) && <p><Link href="/explore">Show all works</Link></p>}

      {hits && (hits.length === 0 ? (
        <p className="empty">Nothing matched. Try fewer or broader words.</p>
      ) : (
        <ul className="works">
          {hits.map((h) => (
            <li key={h.content.id} lang={h.content.language}>
              <h3><Link href={`/content/${h.content.slug}`}>{h.content.title}</Link></h3>
              <p className="muted">{h.content.description}</p>
              {h.matches.slice(0, 2).map((m) => (
                <p key={m.id} className="hit">
                  L{m.layer}: {m.extract ? <Extract text={m.extract} /> : m.text.slice(0, 160)}
                </p>
              ))}
            </li>
          ))}
        </ul>
      ))}

      {list && (list.content.length === 0 ? (
        <p className="empty">No works here yet.</p>
      ) : (
        <ul className="works">
          {list.content.map((u) => (
            <li key={u.id} lang={u.language}>
              <h3><Link href={`/content/${u.slug}`}>{u.title}</Link></h3>
              <p className="muted">{u.description}</p>
              <p className="small muted" lang="en">{u.source_author ? `${u.source_author}. ` : ""}{u.chunk_count} chunks, {u.total_tokens.toLocaleString("en")} tokens</p>
            </li>
          ))}
        </ul>
      ))}
    </>
  );
}
