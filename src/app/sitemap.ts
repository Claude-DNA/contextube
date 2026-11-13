import type { MetadataRoute } from "next";
import { listContent, listFlows } from "@/lib/content";
import { siteUrl } from "@/lib/http";
import { listClouds } from "@/lib/clouds";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const fixed = ["", "/explore", "/clouds", "/states", "/how-it-works", "/about", "/docs", "/docs/mcp", "/for-agents", "/privacy", "/terms"].map((p) => ({
    url: `${site}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));
  try {
    const [{ content }, flows, { clouds }] = await Promise.all([listContent({ limit: 100 }), listFlows(), listClouds({ limit: 100 })]);
    return [
      ...fixed,
      ...content.map((u) => ({ url: `${site}/content/${u.slug}`, lastModified: new Date(u.updated_at), priority: 0.8 })),
      ...flows.map((f) => ({ url: `${site}/flow/${f.slug}`, priority: 0.5 })),
      ...clouds.map((c) => ({ url: `${site}/cloud/${c.slug}`, lastModified: new Date(c.updated_at), priority: 0.7 })),
    ];
  } catch {
    return fixed;
  }
}
