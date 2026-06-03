import { createPostgresPoolConfig } from "../server/db/postgres";

describe("PostgreSQL pool config", () => {
  it("lets explicit DATABASE_SSL config override sslmode query parameters", () => {
    const config = createPostgresPoolConfig({
      postgresUrl:
        "postgresql://postgres:darolink@example.rds.amazonaws.com:5432/postgres?sslmode=require",
      redisUrl: "rediss://example.cache.amazonaws.com:6379",
      postgresSsl: true,
    });

    const url = new URL(String(config.connectionString));

    expect(url.searchParams.has("sslmode")).toBe(false);
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });
});

