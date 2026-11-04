import { NextResponse } from "next/server";
import { openapi } from "@/lib/openapi";
import { siteUrl } from "@/lib/http";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(openapi(siteUrl()), {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" },
  });
}
