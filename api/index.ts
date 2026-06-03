import type { IncomingMessage, ServerResponse } from "node:http";

import { handleApiRequest } from "../server/api/handler";

export function normalizeRewrittenApiUrl(rawUrl: string | undefined) {
  const url = new URL(rawUrl ?? "/api", "http://localhost");
  const rewrittenPath = url.searchParams.get("path");

  if (rewrittenPath !== null) {
    url.pathname = `/api/${rewrittenPath.replace(/^\/+/, "")}`;
    url.searchParams.delete("path");
  } else if (url.pathname === "/api/index") {
    url.pathname = "/api";
  }

  return `${url.pathname}${url.search}`;
}

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  request.url = normalizeRewrittenApiUrl(request.url);
  return handleApiRequest(request, response);
}
