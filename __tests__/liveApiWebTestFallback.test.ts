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

  it("keeps created posts visible in the web test-user feed", async () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH = "true";
    process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN = "";
    global.fetch = jest.fn();

    const { createPost, getPosts } = require("../services/liveApi");

    const createdPost = await createPost({
      type: "job",
      title: "웹 테스트 모집글",
      body: "웹 테스트 유저가 올린 모집글입니다.",
      days: ["화"],
      startTime: "10:00",
      endTime: "12:00",
      wageType: "hourly",
      wageAmount: 12000,
      profileMode: "resource",
      availableTasks: ["카페 보조"],
      employmentTypes: ["partTime"],
      preferredPay: "시간당 12,000원",
    });

    await expect(getPosts()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdPost.id })]),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
