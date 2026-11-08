import Link from "next/link";
import type { CloudSummary } from "@/lib/clouds";
import { Picture } from "./Picture";

/** A cloud in a list: cover, title, description, genre and size. */
export function CloudCard({ c, headingLevel = 3 }: { c: CloudSummary; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <Link href={`/cloud/${c.slug}`}
      className="group flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-colors">
      {c.cover && <Picture img={c.cover} className="w-full aspect-[4/3] object-cover group-hover:opacity-90 transition-opacity" />}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <H className="font-bold text-lg text-white">{c.title}</H>
        <p className="text-sm text-gray-400 line-clamp-3 flex-1">{c.description}</p>
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-800/50 text-xs">
          <span className="text-gray-500">
            {c.genre && <span className="text-violet-300">{c.genre}</span>}
            {c.genre && " · "}
            {c.element_count} elements{c.creator_name ? ` · ${c.creator_name}` : ""}
          </span>
          <span className="text-violet-300 shrink-0">Open cloud →</span>
        </div>
      </div>
    </Link>
  );
}
