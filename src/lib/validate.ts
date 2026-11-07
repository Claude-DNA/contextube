import { z } from "zod";
import { imageInput } from "./images";

/** Words in an extract, not counting a trailing quote or location tag. */
export function extractWordCount(extract: string): number {
  const withoutQuotes = extract
    .replace(/'[^']*'/g, " ")
    .replace(/"[^"]*"/g, " ")
    .replace(/«[^»]*»/g, " ")
    .replace(/\[[^\]]*\]/g, " ");
  const words = withoutQuotes.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  if (words.length === 0) {
    // The quote is the whole extract: count its words instead.
    return extract.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  }
  return words.length;
}

const chunkSchema = z
  .object({
    layer: z.number().int().min(1).max(5),
    type: z.enum(["idea", "narrative", "meta"]).optional(),
    chunk_type: z.enum(["idea", "narrative", "meta"]).optional(),
    extract: z.string().trim().max(400).optional().nullable(),
    text: z.string().trim().min(1, "text is required"),
    source_quote: z.string().trim().optional().nullable(),
    importance: z.number().min(0).max(1).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(imageInput).max(5).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    standalone: z.boolean().optional(),
    links: z.array(z.string()).optional(),
  })
  .superRefine((c, ctx) => {
    if (c.extract && extractWordCount(c.extract) > 8) {
      ctx.addIssue({ code: "custom", path: ["extract"], message: "extract must be 8 words or fewer" });
    }
    if (c.layer === 2 && !c.source_quote) {
      ctx.addIssue({ code: "custom", path: ["source_quote"], message: "L2 chunks must carry a source_quote" });
    }
  });

export const publishSchema = z.object({
  flow: z.string().trim().optional(),
  flow_name: z.string().trim().optional(),
  creator_name: z.string().trim().optional(),
  flow_cover: imageInput.optional(),
  cover: imageInput.optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "slug may hold only a-z, 0-9 and -").optional(),
  title: z.string().trim().min(1, "title is required"),
  description: z.string().optional().default(""),
  language: z.string().trim().min(2).max(12).optional().default("en"),
  tags: z.array(z.string()).optional().default([]),
  domains: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "published"]).optional().default("published"),
  source_title: z.string().optional(),
  source_author: z.string().optional(),
  rights: z.enum(["own", "public_domain", "copyrighted"]).optional().default("own"),
  purchase_url: z.string().url().optional(),
  chunks: z.array(chunkSchema).min(1, "at least one chunk is required").max(2000),
}).superRefine((u, ctx) => {
  if (u.rights === "copyrighted") {
    const hasSourceText = u.chunks.some((c) => c.layer === 5 && (c.type ?? c.chunk_type) === "narrative");
    if (hasSourceText) {
      ctx.addIssue({ code: "custom", path: ["chunks"], message: "copyrighted works may not carry L5 narrative text; use meta notes and purchase_url" });
    }
  }
});

export type PublishInput = z.infer<typeof publishSchema>;
export type ChunkInput = PublishInput["chunks"][number];

export function formatZodError(err: z.ZodError) {
  return err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}
