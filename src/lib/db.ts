import pg from "pg";

// One pool per server instance. Neon's pooled endpoint handles fan-out across instances.
const globalForPg = globalThis as unknown as { pgPool?: pg.Pool };

function makePool() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const local = /localhost|127\.0\.0\.1/.test(url);
  return new pg.Pool({
    connectionString: url,
    ssl: local ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    // Neon can take 1-3 s to wake a scaled-to-zero compute.
    connectionTimeoutMillis: 8_000,
  });
}

export function pool(): pg.Pool {
  if (!globalForPg.pgPool) globalForPg.pgPool = makePool();
  return globalForPg.pgPool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return pool().query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
