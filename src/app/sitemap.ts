import type { MetadataRoute } from "next";
import { listContent, listFlows } from "@/lib/content";
import { siteUrl } from "@/lib/http";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const fixed = ["", "/explore", "/how-it-works", "/about", "/docs", "/docs/mcp", "/privacy", "/terms"].map((p) => ({
    url: `${site}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));
  try {
    const [{ content }, flows] = await Promise.all([listContent({ limit: 100 }), listFlows()]);
    return [
      ...fixed,
      ...content.map((u) => ({ url: `${site}/content/${u.slug}`, lastModified: new Date(u.updated_at), priority: 0.8 })),
      ...flows.map((f) => ({ url: `${site}/flow/${f.slug}`, priority: 0.5 })),
    ];
  } catch {
    return fixed;
  }
}
