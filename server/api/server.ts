import "dotenv/config";

import { createServer } from "node:http";

import { handleApiRequest, shutdownApiResources } from "./handler";

const port = Number(process.env.DARORI_API_PORT ?? 8787);
const server = createServer(handleApiRequest);

server.listen(port, () => {
  console.log(`Darori API listening on http://localhost:${port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function shutdown() {
  await shutdownApiResources();
  server.close(() => process.exit(0));
}
