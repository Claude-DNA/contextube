import Link from "next/link";
import { getFeed, listContent, type ContentUnit } from "@/lib/content";
import { listClouds, getCloudHighlights, getCloudThumbs, getLibraryStats, type CloudSummary } from "@/lib/clouds";
import type { Img } from "@/lib/images";
import { Wordmark } from "@/components/Wordmark";
import { SearchBox } from "@/components/SearchBox";
import { EssenceCard } from "@/components/EssenceCard";
import { HeroDeck } from "@/components/HeroDeck";
import { Picture } from "@/components/Picture";

export const revalidate = 300;

function CloudTile({ c, thumbs }: { c: CloudSummary; thumbs: Img[] }) {
  return (
    <Link href={`/cloud/${c.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gray-900 ring-1 ring-gray-800 group-hover:ring-violet-400/60 transition-shadow">
        {c.cover ? (
          <Picture img={c.cover} className="aspect-[3/4] w-full object-cover object-[50%_30%] transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
        ) : (
          <div className="aspect-[3/4] w-full bg-gradient-to-b from-gray-800 to-gray-950" />
        )}
        {thumbs.length > 1 && (
          <div className="absolute inset-x-2 bottom-2 flex gap-1.5" aria-hidden="true">
            {thumbs.slice(0, 4).map((t) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={t.url} src={t.url} alt="" loading="lazy" className="h-10 w-10 rounded-md object-cover object-top ring-1 ring-black/60 shadow-lg" />
            ))}
          </div>
        )}
      </div>
      <h3 className="mt-3 font-semibold text-white leading-snug group-hover:text-violet-200 transition-colors line-clamp-2">{c.title}</h3>
      <p className="mt-1 text-xs text-gray-500">
        {c.genre ? <span className="text-violet-300">{c.genre}</span> : null}
        {c.genre ? ", " : ""}
        {c.element_count} elements
      </p>
    </Link>
  );
}

function WorkRow({ u }: { u: ContentUnit }) {
  return (
    <Link href={`/content/${u.slug}`} lang={u.language}
      className="group flex gap-4 rounded-xl border border-gray-800 bg-gray-900/60 p-3 hover:border-gray-600 transition-colors">
      {u.cover ? (
        <Picture img={u.cover} className="h-24 w-20 shrink-0 rounded-lg object-cover object-[50%_30%]" />
      ) : (
        <div className="h-24 w-20 shrink-0 rounded-lg bg-gray-800" />
      )}
      <div className="min-w-0 py-1">
        <h3 className="font-semibold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">{u.title}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-1">{u.source_author ?? u.flow_name}</p>
        <p className="mt-2 text-xs text-gray-500" lang="en">
          <span className="text-amber-400 tabular-nums">{u.total_tokens.toLocaleString("en")}</span> tokens in five layers
        </p>
      </div>
    </Link>
  );
}

function SectionHead({ id, title, children, href, link }: { id: string; title: string; children: React.ReactNode; href: string; link: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="text-2xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-1 max-w-2xl text-gray-400">{children}</p>
      </div>
      <Link href={href} className="shrink-0 text-sm text-blue-400 hover:text-blue-300">{link} →</Link>
    </div>
  );
}

export default async function HomePage() {
  const [cards, highlights, { clouds }, thumbs, { content: works }, stats] = await Promise.all([
    getFeed(60),
    getCloudHighlights(14),
    listClouds({ limit: 10 }),
    getCloudThumbs(4),
    listContent({ limit: 12 }),
    getLibraryStats(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden px-4 pt-28 pb-16 lg:pt-32" aria-labelledby="home-title">
        {/* A faint lamp-light behind the deck, so the illustrations sit in a pool of light. */}
        <div aria-hidden="true" className="pointer-events-none absolute right-[-10%] top-0 h-[38rem] w-[38rem] rounded-full bg-amber-200/[0.06] blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_22rem] lg:gap-20">
          <div className="max-w-xl">
            <h1 id="home-title" className="text-6xl font-bold tracking-tight sm:text-7xl">
              <Wordmark />
            </h1>
            <p className="mt-4 text-gray-500 italic tracking-wide">Fabricando Fabricamur <span className="not-italic text-gray-600">(by creating, we shape ourselves)</span></p>
            <p className="mt-8 text-xl leading-relaxed text-gray-200">
              Stories and ideas, taken apart with care: their characters, places and turning points, and what they mean in five layers of depth.
              Read them yourself, or hand them to an AI.
            </p>
            <div className="mt-8 [&_form]:mx-0">
              <SearchBox />
            </div>
            <p className="mt-6 text-sm text-gray-500">
              <Link href="/explore" className="hover:text-white transition-colors"><span className="text-gray-300 tabular-nums">{stats.works}</span> works</Link>
              {", "}
              <Link href="/clouds" className="hover:text-white transition-colors"><span className="text-gray-300 tabular-nums">{stats.clouds}</span> clouds with {stats.elements} elements</Link>
              {", "}
              <span className="text-gray-300 tabular-nums">{stats.essences}</span> essences.{" "}
              <Link href="/for-agents" className="text-blue-400 hover:text-blue-300">Connect an agent</Link>
            </p>
          </div>
          {highlights.length > 0 && <HeroDeck items={highlights} />}
        </div>
      </section>

      {clouds.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="h-clouds">
          <SectionHead id="h-clouds" title="Clouds" href="/clouds" link="All clouds">
            A story&apos;s whole world on one page: plot, characters, places, rules and ideas, each with its picture and its line from the text.
          </SectionHead>
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {clouds.map((c) => <CloudTile key={c.id} c={c} thumbs={thumbs[c.slug] ?? []} />)}
          </div>
        </section>
      )}

      {works.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="h-works">
          <SectionHead id="h-works" title="Read in five layers" href="/explore" link="Explore">
            From a one-line feeling to the full text: open a work at the depth you have time for.
          </SectionHead>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {works.map((u) => <WorkRow key={u.id} u={u} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="h-essences">
        <SectionHead id="h-essences" title="Essences" href="/explore" link="Search ideas">
          Single ideas from every work, each with the line it comes from.
        </SectionHead>
        {cards.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            No essences yet. Writers publish through the API; <Link href="/docs" className="text-blue-400 hover:underline">see the docs</Link>.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {cards.map((c) => (
              <EssenceCard
                key={c.id}
                c={{
                  id: c.id,
                  extract: c.extract,
                  text: c.text,
                  source_quote: c.source_quote,
                  images: c.images,
                  href: `/content/${c.content_slug}`,
                  workTitle: c.content_title,
                  lang: c.language,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
