import type { IncomingMessage, ServerResponse } from "node:http";

import { handleApiRequest } from "../server/api/handler";

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  return handleApiRequest(request, response);
}
