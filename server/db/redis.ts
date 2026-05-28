import { createClient } from "redis";

import { readDatabaseRuntimeConfig, type DatabaseRuntimeConfig } from "./config";

type RedisClient = ReturnType<typeof createClient>;
type RedisClientOptions = NonNullable<Parameters<typeof createClient>[0]>;

let redisClient: RedisClient | null = null;

export async function getRedisClient(
  config: DatabaseRuntimeConfig = readDatabaseRuntimeConfig(),
): Promise<RedisClient> {
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is required for Redis connection");
  }

  let client = redisClient;

  if (!client) {
    client = createClient(createRedisClientOptions(config.redisUrl));
    client.on("error", () => undefined);
    redisClient = client;
  }

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export async function checkRedisConnection(
  client?: RedisClient,
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

function createRedisClientOptions(
  redisUrl: string,
  env: Record<string, string | undefined> = process.env,
): RedisClientOptions {
  const socket: Record<string, unknown> = {
    connectTimeout: Number(env.DATABASE_CONNECT_TIMEOUT_MS ?? 3000),
    reconnectStrategy: false,
  };

  if (isRedisTlsUrl(redisUrl)) {
    Object.assign(socket, {
      tls: true,
      servername: env.REDIS_TLS_SERVERNAME,
      rejectUnauthorized: env.REDIS_TLS_REJECT_UNAUTHORIZED === "false" ? false : undefined,
    });
  }

  return {
    url: redisUrl,
    socket,
  } as RedisClientOptions;
}

function isRedisTlsUrl(redisUrl: string) {
  try {
    return new URL(redisUrl).protocol === "rediss:";
  } catch {
    return false;
  }
}
