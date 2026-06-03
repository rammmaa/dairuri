import { Pool, type PoolConfig } from "pg";

import { readDatabaseRuntimeConfig, type DatabaseRuntimeConfig } from "./config";

let postgresPool: Pool | null = null;

export function getPostgresPool(config: DatabaseRuntimeConfig = readDatabaseRuntimeConfig()) {
  const poolConfig = createPostgresPoolConfig(config);

  if (!postgresPool) {
    postgresPool = new Pool(poolConfig);
  }

  return postgresPool;
}

export function createPostgresPoolConfig(
  config: DatabaseRuntimeConfig = readDatabaseRuntimeConfig(),
): PoolConfig {
  if (!config.postgresUrl) {
    throw new Error("DATABASE_URL is required for PostgreSQL connection");
  }

  return {
    connectionString: config.postgresSsl
      ? withoutPostgresSslQueryParams(config.postgresUrl)
      : config.postgresUrl,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 3000),
    ssl: config.postgresSsl ? { rejectUnauthorized: false } : undefined,
  };
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

function withoutPostgresSslQueryParams(connectionString: string) {
  try {
    const url = new URL(connectionString);
    for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"]) {
      url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
