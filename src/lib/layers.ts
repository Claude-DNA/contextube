export type LayerInfo = { n: number; name: string; short: string; budget: string; holds: string };

/** Canonical layer names and budgets, from the February 2026 llms.txt. */
export const LAYERS: LayerInfo[] = [
  { n: 1, name: "Abstract Associations", short: "Essence", budget: "~50 tokens", holds: "Gut-level impressions, written as a symbolic extract" },
  { n: 2, name: "Ideas + Evidence", short: "Evidence", budget: "~200 tokens", holds: "A claim anchored to a direct source quote" },
  { n: 3, name: "Connections", short: "Connections", budget: "~150 tokens", holds: "Cross-references to other works and concepts" },
  { n: 4, name: "Summary + Commentary", short: "Commentary", budget: "~300 tokens", holds: "Editorial interpretation: the \"so what\"" },
  { n: 5, name: "Full Narrative", short: "Narrative", budget: "variable", holds: "Source text with annotations, plus meta notes on how the context was made" },
];

export function layerName(n: number): string {
  return LAYERS.find((l) => l.n === n)?.name ?? `Layer ${n}`;
}

export const EXTRACT_SYMBOLS = [
  { symbol: "→", meaning: "leads to", example: "desperation→isolation" },
  { symbol: "↔", meaning: "tension pair", example: "hope↔despair" },
  { symbol: "∞", meaning: "deep bond", example: "war∞existential dread" },
  { symbol: "⊂", meaning: "contained within", example: "escape⊂void" },
  { symbol: "∅", meaning: "void or absence", example: "meaning∅purpose" },
  { symbol: ".", meaning: "qualifies the term before it", example: "trust.shattered" },
];
