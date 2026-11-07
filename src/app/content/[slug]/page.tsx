import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContent, getAllChunks, type Chunk } from "@/lib/content";
import { LAYERS } from "@/lib/layers";
import { Extract } from "@/components/Extract";
import { EssenceCard } from "@/components/EssenceCard";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const unit = await getContent(slug);
  if (!unit) return { title: "Not found" };
  return { title: unit.title, description: unit.essence[0]?.text ?? unit.description };
}

const RIGHTS: Record<string, string> = {
  own: "Published by its author",
  public_domain: "Public domain",
  copyrighted: "Copyrighted work, interpreted",
};

function Connection({ c }: { c: Chunk }) {
  const links = Array.isArray(c.metadata?.links) ? (c.metadata.links as string[]) : [];
  return (
    <article className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3">
      {c.extract && <Extract text={c.extract} className="extract block text-xs font-semibold text-blue-400 uppercase tracking-wide" />}
      <p className="text-gray-100 leading-relaxed">{c.text}</p>
      {links.length > 0 && (
        <p className="pt-2 border-t border-gray-800/50 text-xs text-gray-500">
          Connects to{" "}
          {links.map((l, i) => (
            <span key={l}>
              {i > 0 && ", "}
              <Link href={`/content/${l}`} className="text-blue-400 hover:text-blue-300">
                {l.replace(/-/g, " ")} →
              </Link>
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const unit = await getContent(slug);
  if (!unit) notFound();
  const chunks = await getAllChunks(unit.id);
  const byLayer = (n: number) => chunks.filter((c) => c.layer === n);
  const tokensOf = (list: Chunk[]) => list.reduce((s, c) => s + c.tokens, 0);
  const card = (c: Chunk) => ({ id: c.id, extract: c.extract, text: c.text, source_quote: c.source_quote, images: c.images, href: `#${c.id}` });

  return (
    <div lang={unit.language} className="pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/explore" className="text-sm text-gray-500 hover:text-white transition-colors" lang="en">
          ← Back to Explore
        </Link>

        <header className="mt-6 mb-10 space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">{unit.title}</h1>
          {unit.description && <p className="text-lg text-gray-400 max-w-3xl leading-relaxed">{unit.description}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500" lang="en">
            {unit.source_author && (
              unit.flow_slug && unit.flow_name === unit.source_author
                ? <Link href={`/flow/${unit.flow_slug}`} className="text-gray-300 hover:text-blue-400">{unit.source_author}</Link>
                : <span className="text-gray-300">{unit.source_author}</span>
            )}
            {unit.flow_name && unit.flow_name !== unit.source_author && unit.flow_slug && (
              <span>In <Link href={`/flow/${unit.flow_slug}`} className="text-gray-300 hover:text-blue-400">{unit.flow_name}</Link></span>
            )}
            <span>{RIGHTS[unit.rights]}</span>
            <span><span className="text-amber-400">{unit.total_tokens.toLocaleString("en")}</span> tokens · {unit.chunk_count} chunks</span>
          </p>
          {(unit.domains.length > 0 || unit.tags.length > 0) && (
            <ul className="flex flex-wrap gap-2" aria-label="Domains and tags" lang="en">
              {unit.domains.map((d) => (
                <li key={`d-${d}`}>
                  <Link href={`/explore?domain=${encodeURIComponent(d)}`} className="text-xs px-2.5 py-1 rounded-full border bg-blue-900/40 text-blue-300 border-blue-800 hover:border-blue-500 transition-colors">{d}</Link>
                </li>
              ))}
              {unit.tags.map((t) => (
                <li key={`t-${t}`}>
                  <Link href={`/explore?tag=${encodeURIComponent(t)}`} className="text-xs px-2.5 py-1 rounded-full border bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 transition-colors">{t}</Link>
                </li>
              ))}
            </ul>
          )}
        </header>

        <nav aria-label="Layers" lang="en" className="mb-14">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LAYERS.map((l) => {
              const list = byLayer(l.n);
              const body = (
                <>
                  <div className="text-2xl font-bold text-blue-400">L{l.n}</div>
                  <div className="text-sm font-semibold text-white mt-1">{l.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{list.length} {list.length === 1 ? "chunk" : "chunks"}</div>
                  <div className="text-xs text-amber-400 mt-1">{tokensOf(list).toLocaleString("en")} tokens</div>
                </>
              );
              return list.length ? (
                <a key={l.n} href={`#layer-${l.n}`} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center hover:border-blue-500/60 transition-colors">{body}</a>
              ) : (
                <div key={l.n} className="bg-gray-900/40 border border-gray-900 rounded-lg p-3 text-center opacity-50">{body}</div>
              );
            })}
          </div>
          <p className="text-center text-gray-500 text-sm mt-3">← Quick understanding · · · Deep knowledge →</p>
        </nav>

        {LAYERS.map((l) => {
          const list = byLayer(l.n);
          if (!list.length) return null;
          const narrative = list.filter((c) => c.chunk_type === "narrative");
          const notes = list.filter((c) => c.chunk_type !== "narrative");
          return (
            <section key={l.n} id={`layer-${l.n}`} aria-labelledby={`h-layer-${l.n}`} className="mb-16 scroll-mt-20">
              <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-800 pb-3" lang="en">
                <h2 id={`h-layer-${l.n}`} className="text-2xl font-bold">
                  <span className="text-blue-400">L{l.n}</span> <span className="text-white">{l.name}</span>
                </h2>
                <p className="text-sm text-gray-500">
                  {l.holds} · <span className="text-amber-400">{tokensOf(list).toLocaleString("en")} tokens</span>
                </p>
              </header>

              {l.n === 3 ? (
                <div className="grid gap-4 md:grid-cols-2">{list.map((c) => <div key={c.id} id={c.id}><Connection c={c} /></div>)}</div>
              ) : l.n === 4 ? (
                <div className="space-y-4">
                  {list.map((c) => (
                    <article key={c.id} id={c.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-4">
                      {c.extract && <Extract text={c.extract} className="extract block text-xs font-semibold text-amber-400 uppercase tracking-wide" />}
                      {c.text.split(/\n\s*\n/).map((p, i) => (
                        <p key={i} className="text-gray-200 text-lg leading-relaxed max-w-3xl">{p}</p>
                      ))}
                    </article>
                  ))}
                </div>
              ) : l.n === 5 ? (
                <div className="space-y-6">
                  {notes.map((c) => (
                    <p key={c.id} id={c.id} className="text-sm text-gray-400 bg-gray-900/60 border border-gray-800 rounded-xl p-4 leading-relaxed" lang="en">{c.text}</p>
                  ))}
                  {narrative.length > 0 && (
                    <div className="bg-gray-900/30 border border-gray-800 rounded-2xl px-6 py-8 md:px-12">
                      <div className="max-w-3xl mx-auto space-y-5">
                        {narrative.flatMap((c) => c.text.split(/\n\s*\n/).map((p, i) => (
                          <p key={`${c.id}-${i}`} className="text-gray-300 text-lg leading-relaxed">{p}</p>
                        )))}
                      </div>
                    </div>
                  )}
                  {unit.rights === "copyrighted" && unit.purchase_url && (
                    <p className="bg-gradient-to-r from-blue-600/20 via-gray-900 to-amber-600/20 border border-gray-800 rounded-xl p-5 text-gray-300" lang="en">
                      The full text is not reproduced here.{" "}
                      <a href={unit.purchase_url} rel="noopener" className="text-amber-400 hover:text-amber-300 font-medium">Buy {unit.source_title ?? "the work"} →</a>
                    </p>
                  )}
                </div>
              ) : (
                <div className={l.n === 1 ? "columns-1 sm:columns-2 gap-4 space-y-4" : "columns-1 md:columns-2 gap-4 space-y-4"}>
                  {list.map((c) => <div key={c.id} id={c.id} className="break-inside-avoid"><EssenceCard c={card(c)} showFooter={false} /></div>)}
                </div>
              )}
            </section>
          );
        })}

        {unit.rights === "copyrighted" && unit.purchase_url && !byLayer(5).length && (
          <p className="mb-12 text-gray-300" lang="en">
            <a href={unit.purchase_url} rel="noopener" className="text-amber-400 hover:text-amber-300 font-medium">Buy {unit.source_title ?? "the work"} →</a> to read the full text.
          </p>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-sm text-gray-400" lang="en">
          <span className="text-white font-semibold">For agents:</span> read this work at{" "}
          <code className="bg-gray-800 px-2 py-0.5 rounded text-blue-300">/api/v1/content/{unit.slug}</code> or with the MCP tool{" "}
          <code className="bg-gray-800 px-2 py-0.5 rounded text-blue-300">get_content</code>.{" "}
          <Link href="/docs/mcp" className="text-blue-400 hover:underline">Connect →</Link>
        </div>
      </div>
    </div>
  );
}
