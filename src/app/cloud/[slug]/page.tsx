import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCloud, cloudAsText, type CloudElement } from "@/lib/clouds";
import type { CloudKind } from "@/lib/validate";
import { Picture } from "@/components/Picture";
import { CopyForAI } from "@/components/CopyForAI";
import { siteUrl } from "@/lib/http";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCloud(slug).catch(() => null);
  if (!c) return { title: "Cloud not found" };
  return {
    title: c.title,
    description: c.description,
    alternates: { types: { "text/markdown": `${siteUrl()}/api/v1/clouds/${c.slug}/text` } },
    openGraph: c.cover ? { images: [{ url: c.cover.url, alt: c.cover.alt }] } : undefined,
  };
}

/** The four columns of the old cloud page, in its order. */
const COLUMNS: { kind: CloudKind; label: string; icon: string }[] = [
  { kind: "plot", label: "Plot", icon: "📖" },
  { kind: "characters", label: "Characters", icon: "👤" },
  { kind: "stage", label: "Stage", icon: "🎭" },
  { kind: "universe", label: "Universe", icon: "🌍" },
];

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Splits a place's "[Light: …] [Sound: …] [Smell: …]" anchors out of its text. */
function sensory(text: string): { body: string; senses: { sense: string; value: string }[] } {
  const senses: { sense: string; value: string }[] = [];
  const body = text.replace(/\[(Light|Sound|Smell|Touch|Taste):\s*([^\]]+)\]/gi, (_m, sense: string, value: string) => {
    if (!/^not specified$/i.test(value.trim())) senses.push({ sense, value: value.trim() });
    return "";
  }).replace(/\s+$/, "");
  return { body, senses };
}

function ElementCard({ e, kind }: { e: CloudElement; kind: CloudKind }) {
  const m = e.metadata ?? {};
  const quote = str(m.source_quote);
  const when = kind === "plot" ? str(m.when) : null;
  const aliases = Array.isArray(m.aliases) ? m.aliases.filter((a): a is string => typeof a === "string" && a.length > 0) : [];
  const { body, senses } = kind === "stage" ? sensory(e.text) : { body: e.text, senses: [] };
  return (
    <article id={`e-${e.id}`} className="scroll-mt-20 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 target:border-violet-400">
      {e.image && <Picture img={e.image} className="block w-full h-44 object-cover object-[50%_30%]" />}
      <div className="p-5 space-y-3">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white leading-snug">{e.title}</h3>
          {when && when !== "main" && <p className="text-xs text-violet-300">{when === "flashback" ? "Flashback" : "Flash-forward"}</p>}
          {aliases.length > 0 && <p className="text-xs text-gray-500">Also: {aliases.join(", ")}</p>}
        </div>
        <p className="text-[15px] leading-relaxed text-gray-300 whitespace-pre-line">{body}</p>
        {senses.length > 0 && (
          <dl className="space-y-1 text-sm">
            {senses.map((x) => (
              <div key={x.sense} className="flex gap-2">
                <dt className="w-12 shrink-0 text-gray-500">{x.sense}</dt>
                <dd className="text-gray-400">{x.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {quote && (
          <details className="group text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-300">From the text</summary>
            <blockquote className="mt-2 border-l-2 border-violet-500/60 pl-3 italic text-gray-400">{quote}</blockquote>
          </details>
        )}
      </div>
    </article>
  );
}

const LINK_WORDS: Record<string, string> = {
  source: "a source", ancestor: "an ancestor", echo: "an echo", contrast: "a contrast", myth: "a myth it plays on", history: "history it recalls",
};

const isAssociation = (e: CloudElement) => e.metadata?.origin === "association";

function NoteCard({ e }: { e: CloudElement }) {
  const quote = str(e.metadata?.source_quote);
  const type = str(e.metadata?.refType);
  const link = LINK_WORDS[str(e.metadata?.link) ?? ""];
  const sameWord = type && link && link.includes(type.toLowerCase());
  const label = sameWord ? link!.charAt(0).toUpperCase() + link!.slice(1) : [type && type.charAt(0).toUpperCase() + type.slice(1), link].filter(Boolean).join(", ");
  return (
    <article className="flex gap-4 rounded-lg border border-gray-700 bg-gray-900 p-5">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-1 h-6 w-6 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.2 10.8a4 4 0 0 0-5.66 0l-2.83 2.83a4 4 0 0 0 5.66 5.66l1.41-1.41M10.8 13.2a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66l-1.41 1.41" />
      </svg>
      <div className="min-w-0 space-y-1.5">
        <h3 className="text-base font-medium text-white">{e.title}</h3>
        {isAssociation(e) && label && <p className="text-xs text-violet-300">{label}</p>}
        <p className="text-sm leading-relaxed text-gray-400">{e.text}</p>
        {quote && <p className="text-sm italic text-gray-500">“{quote}”</p>}
      </div>
    </article>
  );
}

export default async function CloudPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCloud(slug);
  if (!c) notFound();
  const text = cloudAsText(c);
  const columns = COLUMNS.filter((col) => c.elements[col.kind].length > 0);
  const credits = [c.cover, ...Object.values(c.elements).flat().map((e) => e.image)]
    .filter((img): img is NonNullable<typeof img> => Boolean(img?.credit))
    .filter((img, i, all) => all.findIndex((x) => x.url === img.url) === i);

  // Plot beats grouped under their acts, when they have them.
  const plotGroups: { act: string | null; beats: CloudElement[] }[] = [];
  for (const b of c.elements.plot) {
    const act = str(b.metadata?.act);
    const last = plotGroups[plotGroups.length - 1];
    if (last && last.act === act) last.beats.push(b);
    else plotGroups.push({ act, beats: [b] });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <header className="border-b border-gray-800 pb-8 mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">{c.title}</h1>
          <CopyForAI text={text} className="self-start" />
        </div>
        {c.description && <p className="mt-4 max-w-4xl text-xl leading-relaxed text-gray-400">{c.description}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-gray-400">
          {c.genre && <span className="rounded-full bg-violet-600 px-4 py-1.5 text-white">{c.genre}</span>}
          <span>{c.element_count} elements</span>
          {c.creator_name && (
            c.flow_slug
              ? <Link href={`/flow/${c.flow_slug}`} className="hover:text-white transition-colors">by {c.creator_name}</Link>
              : <span>by {c.creator_name}</span>
          )}
          {c.work_slug && <Link href={`/content/${c.work_slug}`} className="text-blue-400 hover:text-blue-300">Read the five-layer flow →</Link>}
        </div>
        {(c.rights === "copyrighted" || (c.source_title && c.source_title !== c.title)) && (
          <p className="mt-4 text-sm text-gray-500">
            {c.source_title && <>From <cite>{c.source_title}</cite>{c.source_author ? ` by ${c.source_author}` : ""}. </>}
            {c.rights === "copyrighted" && "Quoted under fair use. "}
            {c.purchase_url && <a href={c.purchase_url} className="text-blue-400 hover:text-blue-300" rel="noopener">Get the book →</a>}
          </p>
        )}
      </header>

      {c.elements.references.length > 0 && (
        <section aria-labelledby="h-references" className="mb-14">
          <h2 id="h-references" className="mb-2 flex items-center gap-3 text-2xl font-bold text-gray-300">
            <span aria-hidden="true">📎</span> References
          </h2>
          <p className="mb-6 max-w-3xl text-gray-500">What the story names, and what it brings to mind: the films, series, myths and beliefs its author and readers carry into it.</p>
          {[
            { title: "In the text", list: c.elements.references.filter((e) => !isAssociation(e)) },
            { title: "Associations", list: c.elements.references.filter(isAssociation) },
          ].filter((g) => g.list.length).map((g) => (
            <div key={g.title} className="mb-8 last:mb-0">
              <h3 className="mb-3 text-sm font-semibold text-gray-400">{g.title}</h3>
              <div className="grid gap-4 md:grid-cols-2 max-w-5xl">
                {g.list.map((e) => <NoteCard key={e.id} e={e} />)}
              </div>
            </div>
          ))}
        </section>
      )}

      {columns.length > 0 && (
        <div className={`grid gap-6 md:grid-cols-2 ${columns.length >= 4 ? "xl:grid-cols-4" : columns.length === 3 ? "xl:grid-cols-3" : ""}`}>
          {columns.map((col) => (
            <section key={col.kind} aria-labelledby={`h-${col.kind}`} className="min-w-0">
              <h2 id={`h-${col.kind}`} className="mb-5 flex items-center gap-3 border-b border-gray-800 pb-3 text-2xl font-bold text-white">
                <span aria-hidden="true">{col.icon}</span> {col.label}
              </h2>
              <div className="space-y-5">
                {col.kind === "plot"
                  ? plotGroups.map((g, i) => (
                      <div key={i} className="space-y-5">
                        {g.act && <h3 className="pt-1 text-sm font-medium text-gray-400">{g.act}</h3>}
                        {g.beats.map((e) => <ElementCard key={e.id} e={e} kind="plot" />)}
                      </div>
                    ))
                  : c.elements[col.kind].map((e) => <ElementCard key={e.id} e={e} kind={col.kind} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {c.elements.ideas.length > 0 && (
        <section aria-labelledby="h-ideas" className="mt-14">
          <h2 id="h-ideas" className="mb-5 flex items-center gap-3 border-b border-gray-800 pb-3 text-2xl font-bold text-white">
            <span aria-hidden="true">💡</span> Ideas
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {c.elements.ideas.map((e) => <ElementCard key={e.id} e={e} kind="ideas" />)}
          </div>
        </section>
      )}

      <footer className="mt-16 space-y-4 border-t border-gray-800 pt-6 text-sm text-gray-500">
        <p>
          For AI agents: <a href={`/api/v1/clouds/${c.slug}/text`} className="text-blue-400 hover:text-blue-300">this cloud as text</a>
          {" · "}<a href={`/api/v1/clouds/${c.slug}`} className="text-blue-400 hover:text-blue-300">JSON</a>
          {" · "}MCP tool <code className="rounded bg-gray-800 px-1.5 py-0.5 text-blue-300">get_cloud</code>
        </p>
        {credits.length > 0 && (
          <details>
            <summary className="cursor-pointer hover:text-gray-300">Image credits ({credits.length})</summary>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
              {credits.map((img) => (
                <li key={img.url}>
                  {img.credit}{img.source && <> <a href={img.source} className="text-gray-500 hover:text-gray-300" rel="noopener">Source</a></>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </footer>
    </div>
  );
}
