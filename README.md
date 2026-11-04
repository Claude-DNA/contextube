# ConteXtube

Human-made interpretations of literature, essays and ideas, in five layers of depth, for readers and for AI agents. Live at [contextube.ai](https://contextube.ai).

*Fabricando fabricamur* — by creating, we shape ourselves.

## What's here

| Surface | Path | Notes |
| --- | --- | --- |
| Read API | `/api/v1/*` | No key. Compatible with the February 2026 contract. Spec at `/openapi.json`. |
| Publish API | `POST /api/v1/publish` | Writers only, `Authorization: Bearer <key>`. Upserts by slug. |
| MCP server | `/api/mcp` | Streamable HTTP. Six tools over the same query layer. |
| Pages | `/`, `/explore`, `/content/{slug}`, `/flow/{slug}`, `/docs`, … | Server-rendered. |
| Discovery | `/llms.txt`, `/openapi.json`, `/.well-known/ai-plugin.json`, `/sitemap.xml` | |

All surfaces read through `src/lib/content.ts` and `src/lib/assemble.ts`, so an agent and a reader always see the same data.

## The five layers

| Layer | Name | Per chunk |
| --- | --- | --- |
| L1 | Abstract Associations | ~50 tokens, symbolic extract |
| L2 | Ideas + Evidence | ~200 tokens, must carry `source_quote` |
| L3 | Connections | ~150 tokens, `links` name other works |
| L4 | Summary + Commentary | ~300 tokens |
| L5 | Full Narrative | source text (own or public-domain works only) and meta notes |

## Run locally

```bash
npm install
cp .env.example .env.local        # set DATABASE_URL and PUBLISH_KEYS
npm run migrate                   # applies db/schema.sql
npm run dev
BASE_URL=http://localhost:3000 PUBLISH_KEY=<a key from PUBLISH_KEYS> npm run seed
```

## Deploy

1. Neon project `contextube`, region AWS US East (N. Virginia). Copy the pooled connection string.
2. Vercel project from this repo. Environment variables: `DATABASE_URL`, `PUBLISH_KEYS`, `SITE_URL=https://contextube.ai`.
3. `DATABASE_URL=<neon url> npm run migrate` once, then deploy.
4. Seed: `BASE_URL=https://contextube.ai PUBLISH_KEY=<key> npm run seed`.
5. Point the `contextube.ai` domain at the project.

## Content

`seed/*.json` holds the first works; `seed/sources/*.txt` holds their full texts, split into L5 passages at seed time. The interpretations were drafted by Claude and are meant to be revised by their author.

Spec: ConteXtube Core — Canonical Spec v1 (Claude Docs).
