import "dotenv/config";

import {
  readDatabaseRuntimeConfig,
  validateDatabaseRuntimeConfig,
} from "./config";
import { checkPostgresConnection, closePostgresPool } from "./postgres";
import { checkRedisConnection, closeRedisClient } from "./redis";

async function main() {
  const config = readDatabaseRuntimeConfig();
  const validation = validateDatabaseRuntimeConfig(config);

  if (!validation.ok) {
    console.error(validation.errors.join("\n"));
    process.exitCode = 1;
    return;
  }

  try {
    const [postgresResult, redisResult] = await Promise.allSettled([
      checkPostgresConnection(),
      checkRedisConnection(),
    ]);
    const postgresOk =
      postgresResult.status === "fulfilled" && postgresResult.value;
    const redisOk = redisResult.status === "fulfilled" && redisResult.value;

    console.log(`postgres: ${postgresOk ? "ok" : "failed"}`);
    console.log(`redis: ${redisOk ? "ok" : "failed"}`);

    if (postgresResult.status === "rejected") {
      console.error(`postgres error: ${formatConnectionError(postgresResult.reason)}`);
    }

    if (redisResult.status === "rejected") {
      console.error(`redis error: ${formatConnectionError(redisResult.reason)}`);
    }

    if (!postgresOk || !redisOk) {
      process.exitCode = 1;
    }
  } finally {
    await Promise.all([closePostgresPool(), closeRedisClient()]);
  }
}

function formatConnectionError(error: unknown) {
  if (error instanceof Error) {
    const code = "code" in error ? String(error.code) : "";
    const message = error.message || code;
    return message || error.name;
  }

  return String(error);
}

void main();
