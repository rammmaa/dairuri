describe("authSession", () => {
  const originalSkipAuth = process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH;
  const originalTestToken = process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN;

  afterEach(() => {
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH = originalSkipAuth;
    process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN = originalTestToken;
    jest.resetModules();
  });

  it("initializes a web test auth token only when skip auth is enabled", () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH = "true";
    process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN = " web-test-token ";

    const { getAuthToken, hasAuthSession } = require("../services/authSession");

    expect(hasAuthSession()).toBe(true);
    expect(getAuthToken()).toBe("web-test-token");
  });

  it("ignores the web test auth token unless skip auth is enabled", () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH = "";
    process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN = "web-test-token";

    const { getAuthToken, hasAuthSession } = require("../services/authSession");

    expect(hasAuthSession()).toBe(false);
    expect(getAuthToken()).toBeUndefined();
  });
});
