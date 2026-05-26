import type { IncomingMessage, ServerResponse } from "node:http";

import type { Post } from "../../types/domain";
import { closePostgresPool } from "../db/postgres";
import { closeRedisClient } from "../db/redis";
import {
  AuthenticationError,
  getOptionalRequestUserId,
  requireRequestContext,
  type RequestContext,
} from "./auth";
import { checkRedisRateLimit, RateLimitExceededError } from "./rateLimit";
import {
  createApplication,
  createPost,
  createChatMessage,
  CreatePostInputError,
  getPostById,
  listChatMessages,
  listChatRooms,
  listPosts,
  togglePostLike,
  updateApplicationStatus,
} from "./repository";
import {
  NaverMapsConfigError,
  searchNaverPlaces,
} from "../maps/naverGeocode";

const writeRateLimits = {
  createPost: { limit: 20, windowSeconds: 60 },
  toggleLike: { limit: 120, windowSeconds: 60 },
  createApplication: { limit: 10, windowSeconds: 60 },
  reviewApplication: { limit: 60, windowSeconds: 60 },
  sendChatMessage: { limit: 60, windowSeconds: 60 },
} as const;

export async function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    await routeRequest(request, response);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      sendJson(response, 401, { error: error.message });
      return;
    }

    if (error instanceof RateLimitExceededError) {
      response.setHeader("Retry-After", String(error.retryAfterSeconds));
      sendJson(response, 429, { error: error.message });
      return;
    }

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function normalizeApiPathname(pathname: string) {
  if (pathname === "/api") {
    return "/";
  }

  return pathname.startsWith("/api/") ? pathname.slice(4) : pathname;
}

export async function shutdownApiResources() {
  await closePostgresPool();
  await closeRedisClient();
}

async function routeRequest(request: IncomingMessage, response: ServerResponse) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = normalizeApiPathname(decodeURIComponent(url.pathname));

  if (method === "GET" && pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (method === "GET" && pathname === "/posts") {
    const viewerUserId = getOptionalRequestUserId(request.headers);
    sendJson(response, 200, await listPosts(viewerUserId));
    return;
  }

  if (method === "GET" && pathname === "/maps/geocode") {
    const query = url.searchParams.get("query")?.trim() ?? "";
    if (query.length < 2) {
      sendJson(response, 200, []);
      return;
    }

    try {
      sendJson(response, 200, await searchNaverPlaces(query));
    } catch (error) {
      if (error instanceof NaverMapsConfigError) {
        sendJson(response, 503, { error: error.message });
        return;
      }

      throw error;
    }
    return;
  }

  if (method === "POST" && pathname === "/posts") {
    const context = await requireWriteContext(request, "createPost");
    const body = await readJsonBody<Partial<Post>>(request);
    try {
      sendJson(response, 201, await createPost(body, context.userId));
    } catch (error) {
      if (error instanceof CreatePostInputError) {
        sendJson(response, 400, { error: error.message });
        return;
      }

      throw error;
    }
    return;
  }

  const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
  if (method === "GET" && postMatch) {
    const viewerUserId = getOptionalRequestUserId(request.headers);
    const post = await getPostById(postMatch[1], viewerUserId);
    if (!post) {
      sendJson(response, 404, { error: "post not found" });
      return;
    }
    sendJson(response, 200, post);
    return;
  }

  const postLikeMatch = pathname.match(/^\/posts\/([^/]+)\/like$/);
  if (method === "POST" && postLikeMatch) {
    const context = await requireWriteContext(request, "toggleLike");
    const post = await togglePostLike(postLikeMatch[1], context.userId);
    if (!post) {
      sendJson(response, 404, { error: "post not found" });
      return;
    }
    sendJson(response, 200, post);
    return;
  }

  const applicationMatch = pathname.match(/^\/posts\/([^/]+)\/applications$/);
  if (method === "POST" && applicationMatch) {
    const context = await requireWriteContext(request, "createApplication");
    const body = await readJsonBody<{ intro?: string }>(request);
    if (!body.intro?.trim()) {
      sendJson(response, 400, { error: "intro is required" });
      return;
    }
    sendJson(
      response,
      201,
      await createApplication(applicationMatch[1], body.intro.trim(), context.userId),
    );
    return;
  }

  const acceptMatch = pathname.match(/^\/applications\/([^/]+)\/accept$/);
  if (method === "POST" && acceptMatch) {
    await requireWriteContext(request, "reviewApplication");
    await updateApplicationStatus(acceptMatch[1], "accepted");
    sendJson(response, 204);
    return;
  }

  const rejectMatch = pathname.match(/^\/applications\/([^/]+)\/reject$/);
  if (method === "POST" && rejectMatch) {
    await requireWriteContext(request, "reviewApplication");
    const body = await readJsonBody<{ reason?: string }>(request);
    await updateApplicationStatus(rejectMatch[1], "rejected", body.reason?.trim());
    sendJson(response, 204);
    return;
  }

  if (method === "GET" && pathname === "/chat/rooms") {
    sendJson(response, 200, await listChatRooms());
    return;
  }

  const messagesMatch = pathname.match(/^\/chat\/rooms\/([^/]+)\/messages$/);
  if (messagesMatch && method === "GET") {
    sendJson(response, 200, await listChatMessages(messagesMatch[1]));
    return;
  }

  if (messagesMatch && method === "POST") {
    const context = await requireWriteContext(request, "sendChatMessage");
    const body = await readJsonBody<{ text?: string }>(request);
    if (!body.text?.trim()) {
      sendJson(response, 400, { error: "text is required" });
      return;
    }
    sendJson(
      response,
      201,
      await createChatMessage(messagesMatch[1], body.text.trim(), context.userId),
    );
    return;
  }

  sendJson(response, 404, { error: "not found" });
}

function setCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, X-Darori-User-Id",
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function sendJson(response: ServerResponse, status: number, body?: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });

  if (status === 204 || body === undefined) {
    response.end();
    return;
  }

  response.end(JSON.stringify(body));
}

function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => {
      if (!data.trim()) {
        resolve({} as T);
        return;
      }

      try {
        resolve(JSON.parse(data) as T);
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function requireWriteContext(
  request: IncomingMessage,
  action: keyof typeof writeRateLimits,
): Promise<RequestContext> {
  const context = requireRequestContext(request.headers);

  if (process.env.DARORI_RATE_LIMIT_DISABLED === "true") {
    return context;
  }

  await checkRedisRateLimit({
    key: `darori:${action}:${context.rateLimitKey}`,
    ...writeRateLimits[action],
  });

  return context;
}
