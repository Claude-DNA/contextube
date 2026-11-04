import Link from "next/link";
import { Extract } from "@/components/Extract";
import { getFeed } from "@/lib/content";

export const revalidate = 300;

export default async function FeedPage() {
  const cards = await getFeed(60);
  if (cards.length === 0) {
    return (
      <div className="empty">
        <h1>The feed is empty</h1>
        <p className="lede">Nothing has been published yet. Writers publish through the API; see the developer docs.</p>
        <Link href="/docs" className="button">Read the developer docs</Link>
      </div>
    );
  }

  // The hero is the single most important essence in the library.
  const lead = [...cards].sort((a, b) => b.importance - a.importance)[0];
  const rest = cards.filter((c) => c.id !== lead.id);

  return (
    <>
      <section className="hero" aria-labelledby="lead-extract">
        <p className="hero-intro">
          Each work here is read at five depths, from a symbolic essence down to the full text. This is the surface.
        </p>
        <Extract as="p" id="lead-extract" text={lead.extract ?? lead.content_title} />
        <p className="reading" lang={lead.language}>{lead.text}</p>
        <p className="source">
          From <Link href={`/content/${lead.content_slug}`}>{lead.content_title}</Link>. Open it to read all five layers.
        </p>
      </section>

      <h2 className="sr-only">Essences</h2>
      <ul className="feed">
        {rest.map((c) => (
          <li key={c.id}>
            <Link className="card" href={`/content/${c.content_slug}`} lang={c.language}>
              <Extract text={c.extract ?? c.text.slice(0, 60)} />
              <span className="text">{c.text}</span>
              <span className="work">{c.content_title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
