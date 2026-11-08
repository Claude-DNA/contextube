import type { Metadata } from "next";
import { listClouds } from "@/lib/clouds";
import { CloudCard } from "@/components/CloudCard";
import { NEW_FLOW_URL } from "@/lib/studio";

export const metadata: Metadata = { title: "Clouds", description: "Story clouds: plot, characters, places, world, ideas and references, made in Context Cloud Studio." };
export const revalidate = 300;

export default async function CloudsPage() {
  const { clouds } = await listClouds({ limit: 100 });
  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-10 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Clouds</h1>
        <p className="max-w-2xl text-lg text-gray-400">
          A cloud is a story laid out in parts: its plot beats, characters, places, world rules, ideas and references. Read one here, or hand it to an AI with Copy for AI.
        </p>
      </div>
      {clouds.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clouds.map((c) => <CloudCard key={c.id} c={c} headingLevel={2} />)}
        </div>
      ) : (
        <p className="text-gray-400">No clouds yet.</p>
      )}
      <p className="mt-12 text-sm text-gray-500">
        Build a cloud of your own work in{" "}
        <a href={NEW_FLOW_URL} className="text-amber-400 hover:text-amber-300 font-medium">Context Cloud Studio →</a>
      </p>
    </div>
  );
}
