// Publishes every cloud in seed/clouds/*.json through the public clouds API.
// Usage: BASE_URL=https://contextube.ai PUBLISH_KEY=... npm run seed:clouds  (ONLY=slug,slug for some)
// Image paths starting with /images/ become absolute URLs on BASE_URL.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const key = process.env.PUBLISH_KEY;
if (!key) {
  console.error("PUBLISH_KEY is not set");
  process.exit(1);
}
const dir = new URL("../seed/clouds/", import.meta.url).pathname;
const only = (process.env.ONLY ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const absolute = (img) => (img?.url?.startsWith("/") ? { ...img, url: `${base}${img.url}` } : img);
let failed = 0;

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json")).sort()) {
  if (only.length && !only.includes(file.replace(/\.json$/, ""))) continue;
  const cloud = JSON.parse(await readFile(join(dir, file), "utf8"));
  cloud.cover = absolute(cloud.cover);
  for (const e of cloud.elements) if (e.image) e.image = absolute(e.image);
  const res = await fetch(`${base}/api/v1/clouds`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(cloud),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) console.log(`${res.status} ${cloud.slug}: ${cloud.elements.length} elements`);
  else {
    failed++;
    console.error(`${res.status} ${file}:`, JSON.stringify(body.error ?? body, null, 2));
  }
}
process.exit(failed ? 1 : 0);
