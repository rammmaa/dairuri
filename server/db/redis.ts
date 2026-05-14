import { createClient, type RedisClientType } from "redis";

import { readDatabaseRuntimeConfig, type DatabaseRuntimeConfig } from "./config";

let redisClient: RedisClientType | null = null;

export async function getRedisClient(
  config: DatabaseRuntimeConfig = readDatabaseRuntimeConfig(),
) {
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is required for Redis connection");
  }

  if (!redisClient) {
    redisClient = createClient({
      url: config.redisUrl,
      socket: {
        connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 3000),
        reconnectStrategy: false,
      },
    });
    redisClient.on("error", () => undefined);
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

export async function checkRedisConnection(
  client?: RedisClientType,
): Promise<boolean> {
  const activeClient = client ?? (await getRedisClient());
  return (await activeClient.ping()) === "PONG";
}

export async function closeRedisClient() {
  if (!redisClient) {
    return;
  }

  if (redisClient.isOpen) {
    await redisClient.quit();
  }

  redisClient = null;
}
