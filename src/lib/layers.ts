export type LayerInfo = { n: number; name: string; short: string; budget: string; holds: string; detail: string };

/** Canonical layer names and budgets, from the ConteXtube User Manual v1.0 (February 2026). */
export const LAYERS: LayerInfo[] = [
  {
    n: 1,
    name: "Abstract Associations",
    short: "Pure Ideas",
    budget: "~50 tokens",
    holds: "Gut feelings and associations, written as a symbolic extract",
    detail:
      "The pre-intellectual layer: what an idea feels like before you think about it. Emotional temperature, sensory associations, archetypal resonance, compressed into a symbolic extract.",
  },
  {
    n: 2,
    name: "Ideas & Evidence",
    short: "Evidence",
    budget: "~200 tokens",
    holds: "Ideas backed by a direct quote from the source",
    detail:
      "Feelings become articulated ideas, and every idea is backed by a quote from the source. The lines that make you stop reading belong here. Tension pairs, where two forces collide, make the strongest insights.",
  },
  {
    n: 3,
    name: "Connections",
    short: "Connections",
    budget: "~300 tokens",
    holds: "Cross-references to other works and domains",
    detail:
      "Ideas find their place in the world: echoes across stories and centuries, and bridges between domains, such as theology and AI or fiction and neuroscience. The network becomes visible.",
  },
  {
    n: 4,
    name: "Synthesis",
    short: "Synthesis",
    budget: "~500 tokens",
    holds: "Commentary and analysis: the \"so what\"",
    detail:
      "Earned opinion. Not a neutral summary but an interpretation from someone who has been through the first three layers: the \"so what\" that gives a work its significance.",
  },
  {
    n: 5,
    name: "Full Narrative & Meta",
    short: "Narrative",
    budget: "~1000+ tokens",
    holds: "The full source with notes on how the context was made",
    detail:
      "Everything together: the complete source, linked to the other layers, plus an honest account of how the understanding formed. For works under copyright, notes and a purchase link stand in for the text.",
  },
];

export function layerName(n: number): string {
  return LAYERS.find((l) => l.n === n)?.name ?? `Layer ${n}`;
}

export const EXTRACT_SYMBOLS = [
  { symbol: "→", meaning: "leads to, causes, implies", example: "desperation→isolation" },
  { symbol: "↔", meaning: "tension pair, two-way relation", example: "hope↔despair" },
  { symbol: "=", meaning: "equivalence, identity", example: "procedure=guilt" },
  { symbol: "∅", meaning: "absence, void, negation", example: "meaning∅purpose" },
  { symbol: "∞", meaning: "deep bond, endless recursion", example: "war∞existential dread" },
  { symbol: "∴", meaning: "therefore, conclusion", example: "obedience∴erasure" },
  { symbol: "⊂", meaning: "contained within a larger whole", example: "escape⊂void" },
  { symbol: ".", meaning: "qualifies the term before it", example: "trust.shattered" },
];

/** Plain-text one-liners for llms.txt, MCP instructions and the OpenAPI description. */
export const LAYERS_INLINE = LAYERS.map((l) => `L${l.n} ${l.name} (${l.budget})`).join(" · ");
export const SYMBOLS_INLINE = EXTRACT_SYMBOLS.map((s) => `${s.symbol} ${s.meaning.split(",")[0]}`).join(", ");
