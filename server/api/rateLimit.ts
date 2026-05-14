import { getRedisClient } from "../db/redis";

export type RateLimitStore = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
};

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  count: number;
  limit: number;
  remaining: number;
};

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("rate limit exceeded");
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function checkRateLimit(
  store: RateLimitStore,
  { key, limit, windowSeconds }: RateLimitOptions,
): Promise<RateLimitResult> {
  const count = await store.incr(key);

  if (count === 1) {
    await store.expire(key, windowSeconds);
  }

  if (count > limit) {
    throw new RateLimitExceededError(windowSeconds);
  }

  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
  };
}

export async function checkRedisRateLimit(options: RateLimitOptions) {
  const client = await getRedisClient();

  return checkRateLimit(
    {
      incr: (key) => client.incr(key),
      expire: (key, seconds) => client.expire(key, seconds),
    },
    options,
  );
}
