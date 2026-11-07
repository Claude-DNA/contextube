import Link from "next/link";
import { getFeed } from "@/lib/content";
import { Wordmark } from "@/components/Wordmark";
import { SearchBox } from "@/components/SearchBox";
import { EssenceCard } from "@/components/EssenceCard";

export const revalidate = 300;

export default async function FeedPage() {
  const cards = await getFeed(60);

  return (
    <>
      <div className="pt-20 pb-6 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <Wordmark />
          </h1>
          <p className="text-gray-500 italic text-sm tracking-wide">Fabricando Fabricamur</p>
          <p className="text-gray-400 text-xs">By creating, we shape ourselves</p>
          <SearchBox />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="sr-only">Essences</h2>
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
      </div>
    </>
  );
}
