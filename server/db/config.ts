export type DatabaseRuntimeConfig = {
  postgresUrl?: string;
  redisUrl?: string;
  postgresSsl: boolean;
};

export type DatabaseConfigValidation = {
  ok: boolean;
  errors: string[];
};

export function readDatabaseRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): DatabaseRuntimeConfig {
  return {
    postgresUrl: trimOptional(env.DATABASE_URL),
    redisUrl: trimOptional(env.REDIS_URL),
    postgresSsl:
      env.DATABASE_SSL === "true" ||
      env.PGSSLMODE === "require" ||
      env.POSTGRES_SSL === "true",
  };
}

export function validateDatabaseRuntimeConfig(
  config: DatabaseRuntimeConfig,
): DatabaseConfigValidation {
  const errors: string[] = [];

  if (!config.postgresUrl) {
    errors.push("DATABASE_URL is required for PostgreSQL connection");
  } else if (!isUrlWithProtocol(config.postgresUrl, ["postgres:", "postgresql:"])) {
    errors.push("DATABASE_URL must start with postgres:// or postgresql://");
  }

  if (!config.redisUrl) {
    errors.push("REDIS_URL is required for Redis connection");
  } else if (!isUrlWithProtocol(config.redisUrl, ["redis:", "rediss:"])) {
    errors.push("REDIS_URL must start with redis:// or rediss://");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isUrlWithProtocol(value: string, protocols: string[]) {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
