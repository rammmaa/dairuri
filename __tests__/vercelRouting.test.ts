import vercelConfig from "../vercel.json";

describe("Vercel routing", () => {
  it("routes API requests to functions before the web app fallback", () => {
    const apiIndex = vercelConfig.rewrites.findIndex((rewrite) => rewrite.source === "/api");
    const apiPathIndex = vercelConfig.rewrites.findIndex((rewrite) => rewrite.source === "/api/:path*");
    const fallbackIndex = vercelConfig.rewrites.findIndex(
      (rewrite) => rewrite.source === "/:path((?!api/).*)",
    );

    expect(vercelConfig.rewrites[apiIndex]).toEqual({
      source: "/api",
      destination: "/api/index",
    });
    expect(vercelConfig.rewrites[apiPathIndex]).toEqual({
      source: "/api/:path*",
      destination: "/api/index?path=:path*",
    });
    expect(vercelConfig.rewrites[fallbackIndex]).toEqual({
      source: "/:path((?!api/).*)",
      destination: "/index.html",
    });
    expect(apiIndex).toBeLessThan(apiPathIndex);
    expect(apiPathIndex).toBeLessThan(fallbackIndex);
  });
});
