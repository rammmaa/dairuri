import "dotenv/config";

import { readFile } from "node:fs/promises";
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

export async function readSchemaMigrations(
  schemaPath = path.resolve(process.cwd(), "server/db/schema.sql"),
): Promise<MigrationFile[]> {
  return [
    {
      id: "001_initial_schema",
      sql: await readFile(schemaPath, "utf8"),
    },
  ];
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
