import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { closePostgresPool, getPostgresPool } from "./postgres";

async function main() {
  const schemaPath = path.resolve(process.cwd(), "server/db/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  const pool = getPostgresPool();

  try {
    await pool.query(schemaSql);
    console.log("postgres schema: applied");
  } finally {
    await closePostgresPool();
  }
}

void main();
