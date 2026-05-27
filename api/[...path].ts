import type { IncomingMessage, ServerResponse } from "node:http";

import handler from "./index";

export default function catchAllHandler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  return handler(request, response);
}
