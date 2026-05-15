import {
  checkRateLimit,
  RateLimitExceededError,
  type RateLimitStore,
} from "../server/api/rateLimit";

function createMemoryRateLimitStore(): RateLimitStore {
  const counts = new Map<string, number>();
  return {
    async incr(key) {
      const nextCount = (counts.get(key) ?? 0) + 1;
      counts.set(key, nextCount);
      return nextCount;
    },
    async expire() {
      return true;
    },
  };
}

describe("server API rate limiting", () => {
  it("allows requests up to the configured limit", async () => {
    const store = createMemoryRateLimitStore();

    await expect(
      checkRateLimit(store, {
        key: "rate:application:user:me",
        limit: 2,
        windowSeconds: 60,
      }),
    ).resolves.toEqual({ count: 1, limit: 2, remaining: 1 });

    await expect(
      checkRateLimit(store, {
        key: "rate:application:user:me",
        limit: 2,
        windowSeconds: 60,
      }),
    ).resolves.toEqual({ count: 2, limit: 2, remaining: 0 });
  });

  it("rejects requests after the configured limit", async () => {
    const store = createMemoryRateLimitStore();
    const options = {
      key: "rate:chat:user:me",
      limit: 1,
      windowSeconds: 60,
    };

    await checkRateLimit(store, options);

    await expect(checkRateLimit(store, options)).rejects.toThrow(
      RateLimitExceededError,
    );
  });
});
