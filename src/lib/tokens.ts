import { encode } from "gpt-tokenizer";

/** Token count with one shared tokenizer. Approximate for agents on other model families. */
export function countTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return encode(text).length;
}

/** What a chunk costs an agent: its extract, text and source quote together. */
export function chunkTokens(c: { extract?: string | null; text: string; source_quote?: string | null }): number {
  return countTokens(c.extract) + countTokens(c.text) + countTokens(c.source_quote);
}
