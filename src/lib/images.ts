import { z } from "zod";

/** One image: where it lives, what it shows, and who made it. */
export type Img = { url: string; alt: string; credit?: string; source?: string };

const urlish = z.string().trim().regex(/^(https?:\/\/|\/)\S+$/, "image url must start with http(s):// or /");

/** Accepts a bare URL (Studio's older shape) or a full image object. */
export const imageInput = z.union([
  urlish,
  z.object({
    url: urlish,
    alt: z.string().trim().max(300).optional(),
    credit: z.string().trim().max(300).optional(),
    source: urlish.optional(),
  }),
]);

/** Normalizes anything stored as an image (string, object, or the February `{url}` shape) into an Img. */
export function toImage(x: unknown, fallbackAlt = ""): Img | null {
  if (typeof x === "string" && x) return { url: x, alt: fallbackAlt };
  if (x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string") {
    const o = x as { url: string; alt?: unknown; credit?: unknown; source?: unknown };
    return {
      url: o.url,
      alt: typeof o.alt === "string" ? o.alt : fallbackAlt,
      credit: typeof o.credit === "string" ? o.credit : undefined,
      source: typeof o.source === "string" ? o.source : undefined,
    };
  }
  return null;
}

export function firstImage(images: unknown, fallbackAlt = ""): Img | null {
  return Array.isArray(images) ? toImage(images[0], fallbackAlt) : null;
}
