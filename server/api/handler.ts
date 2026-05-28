import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  ChangePasswordInput,
  LoginInput,
  PhoneVerificationConfirmInput,
  PhoneVerificationStartInput,
  Post,
  SignupInput,
  UpdateUserProfileInput,
} from "../../types/domain";
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
  BusSightingInputError,
  listBusRouteStops,
  listBusRoutes,
  listBusStops,
  listSightingsForStop,
  recordBusSighting,
  type RecordBusSightingInput,
} from "./busArchive";
import {
  acceptApplicationAndCreateChatRoom,
  authenticateUser,
  changeUserPassword,
  checkLoginIdAvailability,
  createApplication,
  createPost,
  createChatMessage,
  createMannerRating,
  createReport,
  CreatePostInputError,
  deleteUserAccount,
  getApplicationDetail,
  getPostById,
  getUserById,
  listApplicationsForPost,
  listChatMessages,
  listChatRooms,
  listReceivedApplicationDetails,
  listSavedPosts,
  listUserPosts,
  listPosts,
  registerUser,
  rejectApplication,
  RepositoryAuthorizationError,
  RepositoryInputError,
  RepositoryNotFoundError,
  togglePostLike,
  updateUserProfile,
} from "./repository";
import {
  confirmPhoneVerification,
  PhoneVerificationInputError,
  requestPhoneVerification,
} from "./phoneVerification";
import {
  NaverMapsConfigError,
  searchNaverPlaces,
} from "../maps/naverGeocode";

const writeRateLimits = {
  auth: { limit: 10, windowSeconds: 60 },
  createPost: { limit: 20, windowSeconds: 60 },
  toggleLike: { limit: 120, windowSeconds: 60 },
  createApplication: { limit: 10, windowSeconds: 60 },
  reviewApplication: { limit: 60, windowSeconds: 60 },
  sendChatMessage: { limit: 60, windowSeconds: 60 },
  submitReport: { limit: 10, windowSeconds: 60 },
  submitMannerRating: { limit: 30, windowSeconds: 60 },
  recordBusSighting: { limit: 30, windowSeconds: 60 },
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

    if (error instanceof RepositoryAuthorizationError) {
      sendJson(response, 403, { error: error.message });
      return;
    }

    if (error instanceof RepositoryNotFoundError) {
      sendJson(response, 404, { error: error.message });
      return;
    }

    if (
      error instanceof RepositoryInputError ||
      error instanceof CreatePostInputError ||
      error instanceof PhoneVerificationInputError
    ) {
      sendJson(response, 400, { error: error.message });
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

  if (method === "POST" && pathname === "/auth/signup") {
    await enforceAnonymousWriteRateLimit(request, "auth");
    const body = await readJsonBody<SignupInput>(request);
    sendJson(response, 201, await registerUser(body));
    return;
  }

  if (method === "GET" && pathname === "/auth/login-id-availability") {
    sendJson(
      response,
      200,
      await checkLoginIdAvailability(url.searchParams.get("loginId") ?? ""),
    );
    return;
  }

  if (method === "POST" && pathname === "/auth/phone-verifications") {
    await enforceAnonymousWriteRateLimit(request, "auth");
    const body = await readJsonBody<PhoneVerificationStartInput>(request);
    sendJson(response, 201, await requestPhoneVerification(body));
    return;
  }

  const phoneVerificationConfirmMatch = pathname.match(
    /^\/auth\/phone-verifications\/([^/]+)\/confirm$/,
  );
  if (method === "POST" && phoneVerificationConfirmMatch) {
    await enforceAnonymousWriteRateLimit(request, "auth");
    const body = await readJsonBody<Omit<PhoneVerificationConfirmInput, "verificationId">>(
      request,
    );
    sendJson(
      response,
      200,
      await confirmPhoneVerification({
        verificationId: phoneVerificationConfirmMatch[1],
        code: body.code,
      }),
    );
    return;
  }

  if (method === "POST" && pathname === "/auth/login") {
    await enforceAnonymousWriteRateLimit(request, "auth");
    const body = await readJsonBody<LoginInput>(request);
    sendJson(response, 200, await authenticateUser(body));
    return;
  }

  if (method === "GET" && pathname === "/me") {
    const context = await requireRequestContext(request.headers);
    const user = await getUserById(context.userId);
    if (!user) {
      sendJson(response, 404, { error: "user not found" });
      return;
    }
    sendJson(response, 200, user);
    return;
  }

  if (method === "PATCH" && pathname === "/me") {
    const context = await requireRequestContext(request.headers);
    const body = await readJsonBody<UpdateUserProfileInput>(request);
    sendJson(response, 200, await updateUserProfile(context.userId, body));
    return;
  }

  if (method === "PATCH" && pathname === "/me/password") {
    const context = await requireWriteContext(request, "auth");
    const body = await readJsonBody<ChangePasswordInput>(request);
    await changeUserPassword(context.userId, body);
    sendJson(response, 204);
    return;
  }

  if (method === "DELETE" && pathname === "/me") {
    const context = await requireWriteContext(request, "auth");
    await deleteUserAccount(context.userId);
    sendJson(response, 204);
    return;
  }

  if (method === "GET" && pathname === "/me/posts") {
    const context = await requireRequestContext(request.headers);
    sendJson(response, 200, await listUserPosts(context.userId, context.userId));
    return;
  }

  if (method === "GET" && pathname === "/me/saved-posts") {
    const context = await requireRequestContext(request.headers);
    sendJson(response, 200, await listSavedPosts(context.userId));
    return;
  }

  if (method === "GET" && pathname === "/me/received-applications") {
    const context = await requireRequestContext(request.headers);
    sendJson(response, 200, await listReceivedApplicationDetails(context.userId));
    return;
  }

  if (method === "GET" && pathname === "/posts") {
    const viewerUserId = await getOptionalRequestUserId(request.headers);
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
    const viewerUserId = await getOptionalRequestUserId(request.headers);
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
  if (method === "GET" && applicationMatch) {
    const context = await requireRequestContext(request.headers);
    sendJson(
      response,
      200,
      await listApplicationsForPost(applicationMatch[1], context.userId),
    );
    return;
  }

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

  const applicationDetailMatch = pathname.match(/^\/applications\/([^/]+)$/);
  if (method === "GET" && applicationDetailMatch) {
    const context = await requireRequestContext(request.headers);
    sendJson(
      response,
      200,
      await getApplicationDetail(applicationDetailMatch[1], context.userId),
    );
    return;
  }

  const acceptMatch = pathname.match(/^\/applications\/([^/]+)\/accept$/);
  if (method === "POST" && acceptMatch) {
    const context = await requireWriteContext(request, "reviewApplication");
    sendJson(
      response,
      200,
      await acceptApplicationAndCreateChatRoom(acceptMatch[1], context.userId),
    );
    return;
  }

  const rejectMatch = pathname.match(/^\/applications\/([^/]+)\/reject$/);
  if (method === "POST" && rejectMatch) {
    const context = await requireWriteContext(request, "reviewApplication");
    const body = await readJsonBody<{ reason?: string }>(request);
    await rejectApplication(rejectMatch[1], context.userId, body.reason?.trim());
    sendJson(response, 204);
    return;
  }

  if (method === "GET" && pathname === "/bus/routes") {
    sendJson(response, 200, await listBusRoutes());
    return;
  }

  if (method === "GET" && pathname === "/bus/stops") {
    sendJson(response, 200, await listBusStops());
    return;
  }

  if (method === "GET" && pathname === "/bus/route-stops") {
    sendJson(response, 200, await listBusRouteStops());
    return;
  }

  const busStopSightingsMatch = pathname.match(
    /^\/bus\/stops\/([^/]+)\/sightings$/,
  );
  if (method === "GET" && busStopSightingsMatch) {
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    if (limit !== undefined && !Number.isFinite(limit)) {
      sendJson(response, 400, { error: "limit must be a number" });
      return;
    }
    sendJson(
      response,
      200,
      await listSightingsForStop(busStopSightingsMatch[1], limit),
    );
    return;
  }

  if (method === "POST" && pathname === "/bus/sightings") {
    const context = await requireWriteContext(request, "recordBusSighting");
    const body = await readJsonBody<RecordBusSightingInput>(request);
    try {
      sendJson(response, 201, await recordBusSighting(body, context.userId));
    } catch (error) {
      if (error instanceof BusSightingInputError) {
        sendJson(response, 400, { error: error.message });
        return;
      }
      throw error;
    }
    return;
  }

  if (method === "GET" && pathname === "/chat/rooms") {
    const context = await requireRequestContext(request.headers);
    sendJson(response, 200, await listChatRooms(context.userId));
    return;
  }

  const messagesMatch = pathname.match(/^\/chat\/rooms\/([^/]+)\/messages$/);
  if (messagesMatch && method === "GET") {
    const context = await requireRequestContext(request.headers);
    sendJson(response, 200, await listChatMessages(messagesMatch[1], context.userId));
    return;
  }

  if (messagesMatch && method === "POST") {
    const context = await requireWriteContext(request, "sendChatMessage");
    const body = await readJsonBody<{ text?: string; imageUrl?: string }>(request);
    if (!body.text?.trim() && !body.imageUrl?.trim()) {
      sendJson(response, 400, { error: "text or imageUrl is required" });
      return;
    }
    sendJson(
      response,
      201,
      await createChatMessage(
        messagesMatch[1],
        { text: body.text?.trim(), imageUrl: body.imageUrl?.trim() },
        context.userId,
      ),
    );
    return;
  }

  if (method === "POST" && pathname === "/reports") {
    const context = await requireWriteContext(request, "submitReport");
    const body = await readJsonBody<{ roomId?: string; reason?: string }>(request);
    if (!body.roomId?.trim() || !body.reason?.trim()) {
      sendJson(response, 400, { error: "roomId and reason are required" });
      return;
    }

    sendJson(
      response,
      201,
      await createReport(body.roomId.trim(), body.reason.trim(), context.userId),
    );
    return;
  }

  if (method === "POST" && pathname === "/manner-ratings") {
    const context = await requireWriteContext(request, "submitMannerRating");
    const body = await readJsonBody<{ roomId?: string; tags?: string[] }>(request);
    if (!body.roomId?.trim() || !Array.isArray(body.tags) || body.tags.length === 0) {
      sendJson(response, 400, { error: "roomId and tags are required" });
      return;
    }

    sendJson(
      response,
      201,
      await createMannerRating(body.roomId.trim(), body.tags, context.userId),
    );
    return;
  }

  sendJson(response, 404, { error: "not found" });
}

function setCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, X-Darori-User-Id",
  );
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
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
  const context = await requireRequestContext(request.headers);

  if (process.env.DARORI_RATE_LIMIT_DISABLED === "true") {
    return context;
  }

  await checkRedisRateLimit({
    key: `darori:${action}:${context.rateLimitKey}`,
    ...writeRateLimits[action],
  });

  return context;
}

async function enforceAnonymousWriteRateLimit(
  request: IncomingMessage,
  action: keyof typeof writeRateLimits,
) {
  if (process.env.DARORI_RATE_LIMIT_DISABLED === "true") {
    return;
  }

  await checkRedisRateLimit({
    key: `darori:${action}:ip:${getRateLimitIp(request)}`,
    ...writeRateLimits[action],
  });
}

function getRateLimitIp(request: IncomingMessage) {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return forwardedValue?.split(",")[0]?.trim() || request.socket.remoteAddress || "unknown";
}
