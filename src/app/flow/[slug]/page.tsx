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
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{flow.name}</h1>
        {flow.description && <p className="text-lg text-gray-400">{flow.description}</p>}
        <p className="text-sm text-gray-500">
          {content.length} {content.length === 1 ? "work" : "works"}{flow.creator_name && flow.creator_name !== flow.name ? `, by ${flow.creator_name}` : ""}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.map((u) => (
          <Link key={u.id} href={`/content/${u.slug}`} lang={u.language}
            className="flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3 hover:border-gray-600 transition-all">
            <h2 className="font-bold text-lg text-white">{u.title}</h2>
            <p className="text-sm text-gray-400 line-clamp-3 flex-1">{u.description}</p>
            <p className="text-xs text-blue-400 pt-2 border-t border-gray-800/50">Explore →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
