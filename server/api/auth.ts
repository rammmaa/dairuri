import type { IncomingHttpHeaders } from "node:http";

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

export function requireRequestContext(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>,
): RequestContext {
  const userId = getOptionalRequestUserId(headers);

  if (!userId) {
    throw new AuthenticationError("authentication required");
  }

  return {
    userId,
    rateLimitKey: `user:${userId}`,
  };
}

export function getOptionalRequestUserId(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>,
) {
  const userId = readHeader(headers, "x-darori-user-id")?.trim();

  if (!userId) {
    return undefined;
  }

  if (!/^[A-Za-z0-9._:-]+$/.test(userId)) {
    throw new AuthenticationError("invalid user id");
  }

  return userId;
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
