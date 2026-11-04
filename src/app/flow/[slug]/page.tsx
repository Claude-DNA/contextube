import Link from "next/link";
import { notFound } from "next/navigation";
import { getFlow, listContent } from "@/lib/content";

export const revalidate = 300;

export default async function FlowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const flow = await getFlow(slug);
  if (!flow) notFound();
  const { content } = await listContent({ flow: slug, limit: 100 });
  return (
    <>
      <h1>{flow.name}</h1>
      {flow.description && <p className="lede">{flow.description}</p>}
      {flow.creator_name && <p className="muted">Created by {flow.creator_name}</p>}
      <ul className="works">
        {content.map((u) => (
          <li key={u.id} lang={u.language}>
            <h3><Link href={`/content/${u.slug}`}>{u.title}</Link></h3>
            <p className="muted">{u.description}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
