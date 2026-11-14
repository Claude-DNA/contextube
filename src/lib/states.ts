/**
 * The state library: characters from literature and screen caught at one moment, each as a formula of feelings
 * with what it is like from inside and what others see. Writers borrow a state for a character of
 * their own; Context Cloud Studio offers them in its formula panel.
 * Data lives in src/data/states/<work>.json, one file per work.
 */
import karamazov from "@/data/states/the-brothers-karamazov.json";
import starTrek from "@/data/states/star-trek.json";

export type CharacterState = {
  id: string;
  character: string;
  /** A label a writer would search for, naming the cause: "after his mentor's death". */
  moment: string;
  situation: string;
  inside: string;
  outside: string;
  /** "(Grief + Longing) × Calm" */
  formula: string;
  /** Vocabulary ids: what is felt together, what is missing, how it shows; intensity 1–3. */
  base: string[];
  missing: string[];
  modifier?: string;
  intensity: number;
  color: string;
  /** The formula spelled out in words: the text to give an AI. */
  for_ai: string;
  quote?: string;
  where: string;
  /** 3 a turning point for the character, 2 a strong characteristic moment. */
  weight: number;
};

export type StateWork = { slug: string; title: string; author: string; source: string; source_url: string; states: CharacterState[] };

export const STATE_WORKS: StateWork[] = [karamazov as StateWork, starTrek as StateWork];

export type StateEntry = CharacterState & { work: string; work_slug: string; author: string };

export function allStates(): StateEntry[] {
  return STATE_WORKS.flatMap((w) => w.states.map((s) => ({ ...s, work: w.title, work_slug: w.slug, author: w.author })));
}

/** Filter by character name, work slug, a vocabulary id, or free words (all must appear somewhere in the entry). */
export function findStates(opts: { character?: string; work?: string; state?: string; q?: string }): StateEntry[] {
  const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());
  const words = (opts.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return allStates().filter((s) => {
    if (opts.character && !has(s.character, opts.character)) return false;
    if (opts.work && s.work_slug !== opts.work) return false;
    if (opts.state && ![...s.base, ...s.missing, s.modifier ?? ""].includes(opts.state.toLowerCase())) return false;
    const text = `${s.character} ${s.moment} ${s.situation} ${s.inside} ${s.outside} ${s.formula}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

/** One state as text to paste into a prompt. */
export function stateAsText(s: StateEntry): string {
  return [
    `CHARACTER STATE: ${s.character}, ${s.moment} (${s.work}, ${s.author})`,
    `Situation: ${s.situation}`,
    `Inside: ${s.inside}`,
    `Outside: ${s.outside}`,
    `Formula: ${s.for_ai}`,
    ...(s.quote ? [`From the text: "${s.quote}"`] : []),
  ].join("\n");
}
