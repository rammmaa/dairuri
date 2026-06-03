import vercelConfig from "../vercel.json";

describe("Vercel routing", () => {
  it("routes API requests to functions before the web app fallback", () => {
    expect(vercelConfig.rewrites[0]).toEqual({
      source: "/api",
      destination: "/api/index",
    });
    expect(vercelConfig.rewrites[1]).toEqual({
      source: "/api/:path*",
      destination: "/api/index?path=:path*",
    });
    expect(vercelConfig.rewrites.at(-1)).toEqual({
      source: "/:path((?!api/).*)",
      destination: "/index.html",
    });
  });
});
