import "dotenv/config";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import type { Post } from "../../types/domain";
import { closePostgresPool } from "../db/postgres";
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

const port = Number(process.env.DARORI_API_PORT ?? 8787);

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    await routeRequest(request, response);
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(port, () => {
  console.log(`Darori API listening on http://localhost:${port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function routeRequest(request: IncomingMessage, response: ServerResponse) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (method === "GET" && pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (method === "GET" && pathname === "/posts") {
    sendJson(response, 200, await listPosts());
    return;
  }

  if (method === "POST" && pathname === "/posts") {
    const body = await readJsonBody<Partial<Post>>(request);
    try {
      sendJson(response, 201, await createPost(body));
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
    const post = await getPostById(postMatch[1]);
    if (!post) {
      sendJson(response, 404, { error: "post not found" });
      return;
    }
    sendJson(response, 200, post);
    return;
  }

  const postLikeMatch = pathname.match(/^\/posts\/([^/]+)\/like$/);
  if (method === "POST" && postLikeMatch) {
    const post = await togglePostLike(postLikeMatch[1]);
    if (!post) {
      sendJson(response, 404, { error: "post not found" });
      return;
    }
    sendJson(response, 200, post);
    return;
  }

  const applicationMatch = pathname.match(/^\/posts\/([^/]+)\/applications$/);
  if (method === "POST" && applicationMatch) {
    const body = await readJsonBody<{ intro?: string }>(request);
    if (!body.intro?.trim()) {
      sendJson(response, 400, { error: "intro is required" });
      return;
    }
    sendJson(response, 201, await createApplication(applicationMatch[1], body.intro.trim()));
    return;
  }

  const acceptMatch = pathname.match(/^\/applications\/([^/]+)\/accept$/);
  if (method === "POST" && acceptMatch) {
    await updateApplicationStatus(acceptMatch[1], "accepted");
    sendJson(response, 204);
    return;
  }

  const rejectMatch = pathname.match(/^\/applications\/([^/]+)\/reject$/);
  if (method === "POST" && rejectMatch) {
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
    const body = await readJsonBody<{ text?: string }>(request);
    if (!body.text?.trim()) {
      sendJson(response, 400, { error: "text is required" });
      return;
    }
    sendJson(response, 201, await createChatMessage(messagesMatch[1], body.text.trim()));
    return;
  }

  sendJson(response, 404, { error: "not found" });
}

function setCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
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

async function shutdown() {
  await closePostgresPool();
  server.close(() => process.exit(0));
}
