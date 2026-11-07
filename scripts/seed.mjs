// Publishes every unit in seed/*.json through the public publish API.
// Usage: BASE_URL=https://contextube.ai PUBLISH_KEY=... npm run seed
// A unit with "l5_source" gets its source text split into L5 narrative passages in reading order.
// seed/images.json supplies covers and one image per idea or meta chunk; its /images/... paths become absolute URLs.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const key = process.env.PUBLISH_KEY;
if (!key) {
  console.error("PUBLISH_KEY is not set");
  process.exit(1);
}

const seedDir = new URL("../seed/", import.meta.url).pathname;
const MAX_PASSAGE = 1800; // characters; roughly 400-500 tokens

function passages(text) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length + 2 > MAX_PASSAGE) {
      out.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) out.push(cur);
  return out;
}

const files = (await readdir(seedDir)).filter((f) => f.endsWith(".json") && f !== "images.json").sort();
const images = JSON.parse(await readFile(join(seedDir, "images.json"), "utf8"));
const absolute = (img) => (img ? { ...img, url: img.url.startsWith("/") ? `${base}${img.url}` : img.url } : undefined);
let failed = 0;

for (const file of files) {
  const unit = JSON.parse(await readFile(join(seedDir, file), "utf8"));
  const art = images.works[unit.slug];
  if (art) {
    unit.cover = absolute(art.cover);
    unit.chunks.forEach((c, i) => {
      if (art.chunks[i]) c.images = [absolute(art.chunks[i])];
    });
  }
  if (unit.flow && images.flows[unit.flow]) unit.flow_cover = absolute(images.flows[unit.flow]);

  if (unit.l5_source) {
    const text = await readFile(join(seedDir, unit.l5_source), "utf8");
    for (const p of passages(text)) unit.chunks.push({ layer: 5, type: "narrative", text: p, importance: 0.2 });
    delete unit.l5_source;
  }

  const res = await fetch(`${base}/api/v1/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(unit),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`${res.status} ${body.content.slug}: ${body.chunk_count} chunks, ${body.total_tokens} tokens`);
  } else {
    failed++;
    console.error(`${res.status} ${file}:`, JSON.stringify(body.error ?? body, null, 2));
  }
}

process.exit(failed ? 1 : 0);
