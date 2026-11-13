import type { Metadata } from "next";
import { STATE_WORKS, stateAsText, type StateEntry } from "@/lib/states";
import { CopyForAI } from "@/components/CopyForAI";
import { STUDIO_URL } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Character states",
  description: "A library of characters from literature, each caught at one moment: what they feel, what is missing, how it shows. Borrow a state for a character of your own.",
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function StateCard({ s }: { s: StateEntry }) {
  return (
    <article id={s.id} className="scroll-mt-20 rounded-lg border border-gray-700 border-l-4 bg-gray-900 p-5 target:border-violet-400" style={{ borderLeftColor: s.color }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-bold leading-snug text-white">{s.moment.charAt(0).toUpperCase() + s.moment.slice(1)}</h3>
          <p className="font-medium text-gray-200">
            {s.formula}
            <span className="ml-2 text-sm font-normal text-gray-500">{["", "an undertone", "plain to see", "overwhelming"][s.intensity] ?? ""}</span>
          </p>
        </div>
        <CopyForAI text={stateAsText(s)} className="shrink-0" />
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-300">{s.situation}</p>
      <dl className="mt-3 space-y-2 text-[15px] leading-relaxed">
        <div>
          <dt className="text-sm text-gray-500">Inside</dt>
          <dd className="text-gray-300">{s.inside}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Outside</dt>
          <dd className="text-gray-300">{s.outside}</dd>
        </div>
      </dl>
      {s.quote && <blockquote className="mt-3 border-l-2 border-violet-500/60 pl-3 text-sm italic text-gray-400">{s.quote}</blockquote>}
      <p className="mt-3 text-xs text-gray-500">{s.where}</p>
    </article>
  );
}

export default function StatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-24">
      <div className="mb-10 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Character states</h1>
        <p className="max-w-2xl text-lg text-gray-400">
          Characters from literature, each caught at one moment: what they feel at once, what is missing, and how it comes out in what they do.
          Borrow a state for a character of your own, or hand it to an AI with Copy for AI.
        </p>
        <p className="max-w-2xl text-sm text-gray-500">
          A formula reads (felt + felt − missing) × how it shows. In <a href={STUDIO_URL} className="text-amber-400 hover:text-amber-300">Context Cloud Studio</a> these
          states are in the formula panel, ready to apply to a character in a scene.
        </p>
      </div>

      {STATE_WORKS.map((w) => {
        const byCharacter = new Map<string, StateEntry[]>();
        for (const s of w.states) {
          const e = { ...s, work: w.title, work_slug: w.slug, author: w.author };
          byCharacter.set(s.character, [...(byCharacter.get(s.character) ?? []), e]);
        }
        const characters = [...byCharacter.entries()].sort((a, b) => b[1].length - a[1].length);
        return (
          <section key={w.slug} aria-labelledby={`w-${w.slug}`} className="mb-16">
            <h2 id={`w-${w.slug}`} className="text-2xl font-bold text-white">{w.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {w.author}. {w.states.length} states of {characters.length} characters, from <a href={w.source_url} className="underline hover:text-gray-300">{w.source}</a>.
            </p>
            <nav aria-label={`Characters of ${w.title}`} className="mt-5 flex flex-wrap gap-2">
              {characters.map(([name, list]) => (
                <a key={name} href={`#${w.slug}-${slug(name)}`} className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white">
                  {name} <span className="text-gray-500">{list.length}</span>
                </a>
              ))}
            </nav>
            {characters.map(([name, list]) => (
              <section key={name} id={`${w.slug}-${slug(name)}`} aria-label={name} className="scroll-mt-20 mt-10">
                <h3 className="flex items-center gap-3 border-b border-gray-800 pb-2 text-xl font-bold text-white">
                  {name}
                  <span className="inline-flex gap-0.5" aria-hidden="true">
                    {list.map((s) => <span key={s.id} className="h-2.5 w-2.5 rounded-full border border-gray-600" style={{ background: s.color }} />)}
                  </span>
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {list.map((s) => <StateCard key={s.id} s={s} />)}
                </div>
              </section>
            ))}
          </section>
        );
      })}
    </div>
  );
}
