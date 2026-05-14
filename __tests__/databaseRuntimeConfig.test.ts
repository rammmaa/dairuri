import {
  readDatabaseRuntimeConfig,
  validateDatabaseRuntimeConfig,
} from "../server/db/config";

describe("database runtime config", () => {
  it("splits mobile API config from server-side PostgreSQL and Redis config", () => {
    const config = readDatabaseRuntimeConfig({
      DATABASE_URL: "postgresql://darori:darori@localhost:5432/darori",
      REDIS_URL: "redis://localhost:6379",
      DATABASE_SSL: "true",
    });

    expect(config).toEqual({
      postgresUrl: "postgresql://darori:darori@localhost:5432/darori",
      redisUrl: "redis://localhost:6379",
      postgresSsl: true,
    });
    expect(validateDatabaseRuntimeConfig(config)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("rejects missing or invalid server-side connection strings", () => {
    const result = validateDatabaseRuntimeConfig({
      postgresUrl: "https://example.com",
      redisUrl: "",
      postgresSsl: false,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      "DATABASE_URL must start with postgres:// or postgresql://",
      "REDIS_URL is required for Redis connection",
    ]);
  });
});
