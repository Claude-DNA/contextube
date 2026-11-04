// Applies db/schema.sql to DATABASE_URL. Usage: DATABASE_URL=... npm run migrate
import { readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const local = /localhost|127\.0\.0\.1/.test(url);
const client = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");

await client.connect();
try {
  await client.query(sql);
  console.log("Schema applied.");
} finally {
  await client.end();
}
