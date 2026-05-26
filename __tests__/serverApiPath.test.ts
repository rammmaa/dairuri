import { normalizeApiPathname } from "../server/api/handler";

describe("server API path normalization", () => {
  it("accepts both local server routes and Vercel /api-prefixed routes", () => {
    expect(normalizeApiPathname("/posts")).toBe("/posts");
    expect(normalizeApiPathname("/api/posts")).toBe("/posts");
    expect(normalizeApiPathname("/api/chat/rooms")).toBe("/chat/rooms");
    expect(normalizeApiPathname("/api")).toBe("/");
  });
});
