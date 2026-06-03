import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { closePostgresPool, getPostgresPool } from "./postgres";

async function main() {
  const schemaPath = path.resolve(process.cwd(), "server/db/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  const pool = getPostgresPool();

  try {
    if (process.env.DATABASE_RESET_SCHEMA === "true") {
      await pool.query(`
        drop table if exists
          bus_sightings,
          bus_route_stops,
          bus_stops,
          bus_routes,
          auth_sessions,
          phone_verifications,
          reports,
          chat_messages,
          chat_room_participants,
          chat_rooms,
          applications,
          post_likes,
          posts,
          vehicles,
          users,
          schema_migrations
        cascade;
        drop type if exists chat_message_type cascade;
        drop type if exists driver_type cascade;
        drop type if exists application_status cascade;
        drop type if exists post_status cascade;
        drop type if exists post_type cascade;
      `);
      console.log("postgres schema: reset");
    }

    await pool.query(schemaSql);
    console.log("postgres schema: applied");
  } finally {
    await closePostgresPool();
  }
}

void main();
