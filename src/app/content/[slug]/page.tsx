import Link from "next/link";
import { Extract } from "@/components/Extract";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContent, getAllChunks, type Chunk } from "@/lib/content";
import { LAYERS } from "@/lib/layers";

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

function ChunkView({ c }: { c: Chunk }) {
  const links = Array.isArray(c.metadata?.links) ? (c.metadata.links as string[]) : [];
  return (
    <article className={`chunk ${c.chunk_type}`}>
      {c.extract && <Extract text={c.extract} />}
      <p className="body">{c.text}</p>
      {c.source_quote && <blockquote>{c.source_quote}</blockquote>}
      {links.length > 0 && (
        <p className="links">
          Connects to{" "}
          {links.map((l, i) => (
            <span key={l}>
              {i > 0 && ", "}
              <Link href={`/content/${l}`}>{l.replace(/-/g, " ")}</Link>
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
  const present = LAYERS.filter((l) => chunks.some((c) => c.layer === l.n));

  return (
    <div lang={unit.language}>
      <header className="unit-head">
        <h1>{unit.title}</h1>
        {unit.description && <p className="lede">{unit.description}</p>}
        <ul className="unit-meta" lang="en">
          {unit.source_author && (
            <li>
              {unit.flow_name === unit.source_author && unit.flow_slug
                ? <Link href={`/flow/${unit.flow_slug}`}>{unit.source_author}</Link>
                : unit.source_author}
            </li>
          )}
          {unit.flow_name && unit.flow_name !== unit.source_author && (
            <li>In <Link href={`/flow/${unit.flow_slug}`}>{unit.flow_name}</Link></li>
          )}
          <li>{RIGHTS[unit.rights]}</li>
          <li>{unit.total_tokens.toLocaleString("en")} tokens across {unit.chunk_count} chunks</li>
        </ul>
        {(unit.domains.length > 0 || unit.tags.length > 0) && (
          <ul className="tags" aria-label="Domains and tags" lang="en">
            {unit.domains.map((d) => <li key={`d-${d}`}><Link href={`/explore?domain=${encodeURIComponent(d)}`}>{d}</Link></li>)}
            {unit.tags.map((t) => <li key={`t-${t}`}><Link href={`/explore?tag=${encodeURIComponent(t)}`}>{t}</Link></li>)}
          </ul>
        )}
      </header>

      <div className="strata-layout">
        <nav className="gauge" aria-label="Layers" lang="en">
          <ol>
            {present.map((l) => (
              <li key={l.n}>
                <a href={`#layer-${l.n}`}>
                  <span className={`bar l${l.n}`} aria-hidden="true" />
                  <span className="label">L{l.n} {l.short}</span>
                </a>
              </li>
            ))}
          </ol>
          <p className="gauge-note">Surface at the top. Each layer down holds more detail.</p>
        </nav>

        <div>
          {present.map((l) => {
            const layerChunks = chunks.filter((c) => c.layer === l.n);
            const tokens = layerChunks.reduce((s, c) => s + c.tokens, 0);
            return (
              <section key={l.n} id={`layer-${l.n}`} className={`stratum l${l.n}`} aria-labelledby={`h-layer-${l.n}`}>
                <header lang="en">
                  <h2 id={`h-layer-${l.n}`}>L{l.n} {l.name}</h2>
                  <p>{l.holds}. {layerChunks.length} {layerChunks.length === 1 ? "chunk" : "chunks"}, {tokens.toLocaleString("en")} tokens.</p>
                </header>
                {layerChunks.map((c) => <ChunkView key={c.id} c={c} />)}
                {l.n === 5 && unit.rights === "copyrighted" && unit.purchase_url && (
                  <p className="purchase" lang="en">
                    The full text is not reproduced here. <a href={unit.purchase_url} rel="noopener">Buy {unit.source_title ?? "the work"}</a> to read it.
                  </p>
                )}
              </section>
            );
          })}
          {unit.rights === "copyrighted" && unit.purchase_url && !present.some((l) => l.n === 5) && (
            <p className="purchase" lang="en">
              <a href={unit.purchase_url} rel="noopener">Buy {unit.source_title ?? "the work"}</a> to read the full text.
            </p>
          )}
          <p className="muted small" lang="en">
            Agents can read this work through the API at{" "}
            <code>/api/v1/content/{unit.slug}</code> or the MCP tool <code>get_content</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
