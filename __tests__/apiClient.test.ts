import { apiRequest } from "../services/apiClient";

describe("apiRequest", () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.EXPO_PUBLIC_DARORI_API_BASE_URL;
  const originalUserId = process.env.EXPO_PUBLIC_DARORI_USER_ID;

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
    global.fetch = originalFetch;
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
});
