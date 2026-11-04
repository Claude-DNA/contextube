import { NextResponse, type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

export function json(data: unknown, init: { status?: number; cache?: boolean } = {}) {
  const res = NextResponse.json(data, { status: init.status ?? 200 });
  if (init.cache !== false && (init.status ?? 200) === 200) {
    // Reads are cached at the edge for 5 minutes.
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  }
  return res;
}

export function error(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

// ---------- Rate limit (per server instance; good enough for v1) ----------

const hits = new Map<string, { count: number; reset: number }>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function rateLimit(req: Request) {
  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60);
  const now = Date.now();
  const ip = clientIp(req);
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return null;
  }
  entry.count += 1;
  if (entry.count > limit) {
    const res = error(429, "rate_limited", `Limit is ${limit} requests per minute.`);
    res.headers.set("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
    return res;
  }
  return null;
}

// ---------- Publish keys ----------

const digest = (s: string) => createHash("sha256").update(s).digest();

/** Returns the writer's name for a valid `Authorization: Bearer <secret>`, else null. */
export function authorizeWriter(req: NextRequest | Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const given = digest(token);
  for (const pair of (process.env.PUBLISH_KEYS ?? "").split(",")) {
    const i = pair.indexOf(":");
    if (i < 1) continue;
    const name = pair.slice(0, i).trim();
    const secret = pair.slice(i + 1).trim();
    if (secret.length < 16 || secret === "replace-me") continue;
    if (timingSafeEqual(given, digest(secret))) return name;
  }
  return null;
}

export function intParam(v: string | null, fallback: number) {
  const n = v === null ? NaN : Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function siteUrl() {
  return (process.env.SITE_URL ?? "https://contextube.ai").replace(/\/$/, "");
}

/** Wraps a route handler: rate limit, then run, turning thrown errors into a 500 JSON body. */
export function handle<A extends unknown[]>(fn: (req: NextRequest, ...args: A) => Promise<Response>, opts: { limit?: boolean } = {}) {
  return async (req: NextRequest, ...args: A): Promise<Response> => {
    if (opts.limit !== false) {
      const limited = rateLimit(req);
      if (limited) return limited;
    }
    try {
      return await fn(req, ...args);
    } catch (err) {
      console.error(err);
      return error(500, "internal", "Something went wrong on our side.");
    }
  };
}
