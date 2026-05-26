import vercelConfig from "../vercel.json";

describe("Vercel routing", () => {
  it("routes API requests to functions before the web app fallback", () => {
    expect(vercelConfig.rewrites[0]).toEqual({
      source: "/:path((?!api/).*)",
      destination: "/index.html",
    });
  });
});
