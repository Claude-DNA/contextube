import { notFound } from "next/navigation";
import { getFlow, listContent } from "@/lib/content";
import { WorkCard } from "@/components/WorkCard";
import { Picture } from "@/components/Picture";
import { NEW_FLOW_URL } from "@/lib/studio";

export const revalidate = 300;

export default async function FlowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const flow = await getFlow(slug);
  if (!flow) notFound();
  const { content } = await listContent({ flow: slug, limit: 100 });
  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <div className={`mb-10 ${flow.cover ? "flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between" : ""}`}>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">{flow.name}</h1>
        {flow.description && <p className="text-lg text-gray-400">{flow.description}</p>}
        <p className="text-sm text-gray-500">
          {content.length} {content.length === 1 ? "work" : "works"}{flow.creator_name && flow.creator_name !== flow.name ? `, by ${flow.creator_name}` : ""}
        </p>
      </div>
      {flow.cover && (
        <figure className="shrink-0">
          <Picture img={flow.cover} eager className="block max-h-56 w-auto mx-auto rounded-2xl border border-gray-800" />
          {flow.cover.credit && <figcaption className="mt-2 text-xs text-gray-600 max-w-xs">{flow.cover.credit}</figcaption>}
        </figure>
      )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.map((u) => <WorkCard key={u.id} u={u} headingLevel={2} />)}
      </div>
      <p className="mt-12 text-sm text-gray-500">
        Have a reading of your own?{" "}
        <a href={NEW_FLOW_URL} className="text-amber-400 hover:text-amber-300 font-medium">Create a new flow in Context Cloud Studio →</a>
      </p>
    </div>
  );
}
