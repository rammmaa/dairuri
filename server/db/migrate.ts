import "dotenv/config";

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { PoolClient } from "pg";

import { closePostgresPool, getPostgresPool } from "./postgres";

export type MigrationFile = {
  id: string;
  sql: string;
};

export function createMigrationPlan(
  appliedIds: readonly string[],
  migrations: readonly MigrationFile[],
) {
  const seenIds = new Set<string>();

  for (const migration of migrations) {
    if (seenIds.has(migration.id)) {
      throw new Error(`duplicate migration id: ${migration.id}`);
    }
    seenIds.add(migration.id);
  }

  const applied = new Set(appliedIds);
  return migrations.filter((migration) => !applied.has(migration.id));
}

/**
 * Returns the ordered list of schema migrations: first the initial schema
 * (001_initial_schema, loaded from schema.sql for backward compatibility with
 * already-deployed databases), then any per-feature migration files found in
 * server/db/migrations/*.sql sorted by filename. Each filename becomes the
 * migration id with the ".sql" suffix stripped.
 *
 * The function tolerates a missing migrations directory so the initial schema
 * path keeps working on fresh checkouts and in tests that do not need extra
 * migrations.
 */
export async function readSchemaMigrations(
  schemaPath = path.resolve(process.cwd(), "server/db/schema.sql"),
  migrationsDir = path.resolve(process.cwd(), "server/db/migrations"),
): Promise<MigrationFile[]> {
  const initial: MigrationFile = {
    id: "001_initial_schema",
    sql: await readFile(schemaPath, "utf8"),
  };

  const extras = await readMigrationDirectory(migrationsDir);
  return [initial, ...extras];
}

async function readMigrationDirectory(
  migrationsDir: string,
): Promise<MigrationFile[]> {
  let entries: string[];
  try {
    const dirInfo = await stat(migrationsDir);
    if (!dirInfo.isDirectory()) {
      return [];
    }
    entries = await readdir(migrationsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const sqlEntries = entries
    .filter((name) => name.toLowerCase().endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(
    sqlEntries.map(async (name) => ({
      id: name.replace(/\.sql$/i, ""),
      sql: await readFile(path.join(migrationsDir, name), "utf8"),
    })),
  );
}

export async function runMigrations() {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await ensureMigrationsTable(client);

    const migrations = await readSchemaMigrations();
    const appliedIds = await readAppliedMigrationIds(client);
    const plan = createMigrationPlan(appliedIds, migrations);

    for (const migration of plan) {
      await client.query(migration.sql);
      await client.query(
        "insert into schema_migrations (id) values ($1) on conflict do nothing",
        [migration.id],
      );
      console.log(`postgres migration applied: ${migration.id}`);
    }

    await client.query("commit");

    if (plan.length === 0) {
      console.log("postgres migrations: already up to date");
    }
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await closePostgresPool();
  }
}

async function ensureMigrationsTable(client: PoolClient) {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function readAppliedMigrationIds(client: PoolClient) {
  const { rows } = await client.query<{ id: string }>(
    "select id from schema_migrations order by applied_at asc, id asc",
  );
  return rows.map((row) => row.id);
}

if (process.env.NODE_ENV !== "test") {
  void runMigrations();
}
