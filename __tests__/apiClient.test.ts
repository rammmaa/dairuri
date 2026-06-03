import { apiRequest } from "../services/apiClient";
import { clearAuthSession, setAuthSession } from "../services/authSession";

describe("apiRequest", () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.EXPO_PUBLIC_DARORI_API_BASE_URL;
  const originalUserId = process.env.EXPO_PUBLIC_DARORI_USER_ID;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_DARORI_API_BASE_URL = "https://api.darori.test";
    process.env.EXPO_PUBLIC_DARORI_USER_ID = " author-1 ";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_DARORI_API_BASE_URL = originalBaseUrl;
    process.env.EXPO_PUBLIC_DARORI_USER_ID = originalUserId;
    process.env.NODE_ENV = originalNodeEnv;
    global.fetch = originalFetch;
    clearAuthSession();
  });

  it("sends the current user id header when configured", async () => {
    await apiRequest("/posts", {
      method: "POST",
      body: { title: "test" },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.darori.test/posts",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Darori-User-Id": "author-1",
        }),
      }),
    );
  });

  it("uses bearer session tokens before development user headers", async () => {
    setAuthSession("session-token", {
      id: "user-1",
      nickname: "테스터",
      temperature: 36.5,
      driverType: "nonDriver",
    });

    await apiRequest("/posts");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.darori.test/posts",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
        }),
      }),
    );
  });

  it("falls back to the production EC2 API domain in production builds", async () => {
    process.env.EXPO_PUBLIC_DARORI_API_BASE_URL = "";
    process.env.NODE_ENV = "production";

    await apiRequest("/health");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.dairuri.harammm.me/health",
      expect.any(Object),
    );
  });
});
