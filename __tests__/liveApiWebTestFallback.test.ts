describe("liveApi web test fallback", () => {
  const originalSkipAuth = process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH;
  const originalTestToken = process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH = originalSkipAuth;
    process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN = originalTestToken;
    global.fetch = originalFetch;
    jest.resetModules();
  });

  it("uses local test user data for protected reads when web skip-auth has no token", async () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH = "true";
    process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN = "";
    global.fetch = jest.fn();

    const { getMe, getSavedPosts } = require("../services/liveApi");

    await expect(getMe()).resolves.toMatchObject({ id: "me" });
    await expect(getSavedPosts()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "job-1" })]),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
