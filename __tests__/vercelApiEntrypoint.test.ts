import { normalizeRewrittenApiUrl } from "../api";

describe("Vercel API entrypoint", () => {
  it("restores rewritten nested API paths before handing off to the shared handler", () => {
    expect(normalizeRewrittenApiUrl("/api/index?path=bus/stops")).toBe(
      "/api/bus/stops",
    );
    expect(normalizeRewrittenApiUrl("/api/index?path=chat/rooms/room-1/messages")).toBe(
      "/api/chat/rooms/room-1/messages",
    );
    expect(normalizeRewrittenApiUrl("/api/index?path=maps/geocode&query=청도")).toBe(
      "/api/maps/geocode?query=%EC%B2%AD%EB%8F%84",
    );
  });

  it("maps the base API rewrite back to /api", () => {
    expect(normalizeRewrittenApiUrl("/api/index")).toBe("/api");
  });
});
