import { Pool } from "pg";

import { readDatabaseRuntimeConfig, type DatabaseRuntimeConfig } from "./config";

let postgresPool: Pool | null = null;

export function getPostgresPool(config: DatabaseRuntimeConfig = readDatabaseRuntimeConfig()) {
  if (!config.postgresUrl) {
    throw new Error("DATABASE_URL is required for PostgreSQL connection");
  }

  if (!postgresPool) {
    postgresPool = new Pool({
      connectionString: config.postgresUrl,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      ssl: config.postgresSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return postgresPool;
}

export async function checkPostgresConnection(
  pool: Pool = getPostgresPool(),
): Promise<boolean> {
  const result = await pool.query<{ ok: number }>("select 1 as ok");
  return result.rows[0]?.ok === 1;
}

export async function closePostgresPool() {
  if (!postgresPool) {
    return;
  }

  await postgresPool.end();
  postgresPool = null;
}
