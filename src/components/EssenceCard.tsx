import Link from "next/link";
import { Extract } from "./Extract";
import { Picture } from "./Picture";
import { firstImage } from "@/lib/images";

export type CardData = {
  id: string;
  extract: string | null;
  text: string;
  source_quote?: string | null;
  images?: unknown[];
  href: string;
  workTitle?: string;
  lang?: string;
};

/** The original essence card: image, blue extract, text, quote, then the work and "Explore →". */
export function EssenceCard({ c, showFooter = true }: { c: CardData; showFooter?: boolean }) {
  const image = firstImage(c.images, c.extract ?? "");
  return (
    <article
      lang={c.lang}
      className="break-inside-avoid bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all group"
    >
      {image && (
        <Link href={c.href} tabIndex={-1}>
          <Picture img={image} className="w-full aspect-[4/3] object-cover object-[50%_30%] group-hover:opacity-90 transition-opacity" />
        </Link>
      )}
      <div className="p-5 space-y-3">
        {c.extract && <Extract text={c.extract} className="extract block text-xs font-semibold text-blue-400 uppercase tracking-wide" />}
        <p className="text-gray-100 leading-relaxed whitespace-pre-line">{c.text}</p>
        {c.source_quote && (
          <p className="text-sm text-gray-500 italic border-l-2 border-gray-700 pl-3 leading-relaxed">
            {/^["“'‘«]/.test(c.source_quote) ? c.source_quote : `“${c.source_quote}”`}
          </p>
        )}
        {showFooter && c.workTitle && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
            <Link href={c.href} className="text-xs text-gray-500 hover:text-blue-400 transition-colors line-clamp-1">
              {c.workTitle}
            </Link>
            <Link href={c.href} className="text-xs text-blue-400 hover:text-blue-300 shrink-0 ml-2" aria-label={`Explore ${c.workTitle}`}>
              Explore →
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
