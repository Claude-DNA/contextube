import Link from "next/link";
import type { ContentUnit } from "@/lib/content";
import { Picture } from "./Picture";

/** A work in a list: cover, title, description, author and size. */
export function WorkCard({ u, headingLevel = 3 }: { u: ContentUnit; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <Link href={`/content/${u.slug}`} lang={u.language}
      className="group flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-colors">
      {u.cover && <Picture img={u.cover} className="w-full aspect-[4/3] object-cover group-hover:opacity-90 transition-opacity" />}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <H className="font-bold text-lg text-white">{u.title}</H>
        <p className="text-sm text-gray-400 line-clamp-3 flex-1">{u.description}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-800/50 text-xs" lang="en">
          <span className="text-gray-500">{u.source_author ?? u.flow_name} · <span className="text-amber-400">{u.total_tokens.toLocaleString("en")}</span> tokens</span>
          <span className="text-blue-400">Explore →</span>
        </div>
      </div>
    </Link>
  );
}
