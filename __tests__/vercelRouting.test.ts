import vercelConfig from "../vercel.json";

describe("Vercel routing", () => {
  it("routes API requests to functions before the web app fallback", () => {
    expect(vercelConfig.rewrites[0]).toEqual({
      source: "/api/(.*)",
      destination: "/api/$1",
    });
    expect(vercelConfig.rewrites.at(-1)).toEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });
});
