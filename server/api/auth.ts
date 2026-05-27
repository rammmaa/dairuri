import type { IncomingHttpHeaders } from "node:http";

import { getPostgresPool } from "../db/postgres";
import { hashSessionToken } from "./sessionCrypto";

export type RequestContext = {
  userId: string;
  rateLimitKey: string;
};

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function requireRequestContext(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>,
): Promise<RequestContext> {
  const userId = await getOptionalRequestUserId(headers);

  if (!userId) {
    throw new AuthenticationError("authentication required");
  }

  return {
    userId,
    rateLimitKey: `user:${userId}`,
  };
}

export async function getOptionalRequestUserId(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>,
): Promise<string | undefined> {
  const bearerToken = readBearerToken(headers);
  if (bearerToken) {
    return getSessionUserId(bearerToken);
  }

  if (!isDevelopmentUserHeaderAllowed()) {
    return undefined;
  }

  const userId = readHeader(headers, "x-darori-user-id")?.trim();

  if (!userId) {
    return undefined;
  }

  if (!/^[A-Za-z0-9._:-]+$/.test(userId)) {
    throw new AuthenticationError("invalid user id");
  }

  return userId;
}

async function getSessionUserId(token: string) {
  const { rows } = await getPostgresPool().query<{ user_id: string }>(
    `
      select user_id
      from auth_sessions
      where token_hash = $1 and expires_at > now()
    `,
    [hashSessionToken(token)],
  );

  return rows[0]?.user_id;
}

function readBearerToken(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>,
) {
  const authorization = readHeader(headers, "authorization")?.trim();
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isDevelopmentUserHeaderAllowed() {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.DARORI_ALLOW_DEV_USER_HEADER === "true"
  );
}

function readHeader(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>,
  name: string,
) {
  const directValue = headers[name];
  const value =
    directValue ??
    Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];

  return Array.isArray(value) ? value[0] : value;
}
