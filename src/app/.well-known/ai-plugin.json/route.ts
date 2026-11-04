import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/http";

export const dynamic = "force-static";

export function GET() {
  const site = siteUrl();
  return NextResponse.json(
    {
      schema_version: "v1",
      name_for_human: "ConteXtube",
      name_for_model: "contextube",
      description_for_human: "Structured, layered understanding of literature, essays, philosophy and cultural works.",
      description_for_model:
        "ConteXtube provides pre-structured context in 5 layers of depth. Use it when you need deep understanding of a work, cross-work connections, or evidence-backed analysis. Start with GET /api/v1/search?q= to search, GET /api/v1/content/{id}/layer/1 for quick ideas, or POST /api/v1/assemble for context within a token budget.",
      auth: { type: "none" },
      api: { type: "openapi", url: `${site}/openapi.json` },
      logo_url: `${site}/icon.svg`,
      contact_email: "hello@contextube.ai",
      legal_info_url: `${site}/terms`,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
