import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/http";

/** AI crawlers are welcome: being read by agents is the point. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/v1/publish"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
