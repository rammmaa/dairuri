describe("authSession", () => {
  const originalSkipAuth = process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH;
  const originalTestToken = process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN;
  let secureStore: {
    isAvailableAsync: jest.Mock;
    getItemAsync: jest.Mock;
    setItemAsync: jest.Mock;
    deleteItemAsync: jest.Mock;
  };

  function mockSecureStore(initialEntries: Record<string, string> = {}) {
    const entries = new Map(Object.entries(initialEntries));
    secureStore = {
      isAvailableAsync: jest.fn(async () => true),
      getItemAsync: jest.fn(async (key: string) => entries.get(key) ?? null),
      setItemAsync: jest.fn(async (key: string, value: string) => {
        entries.set(key, value);
      }),
      deleteItemAsync: jest.fn(async (key: string) => {
        entries.delete(key);
      }),
    };

    jest.doMock("expo-secure-store", () => secureStore);
    return entries;
  }

  afterEach(() => {
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH = originalSkipAuth;
    process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN = originalTestToken;
    jest.dontMock("expo-secure-store");
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

  it("persists login sessions and restores them after a module reload", async () => {
    mockSecureStore();
    jest.resetModules();

    const firstLoad = require("../services/authSession");
    await firstLoad.persistAuthSession("session-token", {
      id: "me",
      nickname: "다로리인",
      temperature: 40.6,
      driverType: "driver",
    });

    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      "darori.auth.session",
      expect.stringContaining("session-token"),
    );

    jest.resetModules();
    jest.doMock("expo-secure-store", () => secureStore);
    const secondLoad = require("../services/authSession");

    await expect(secondLoad.restoreAuthSession()).resolves.toMatchObject({
      token: "session-token",
      user: { id: "me", nickname: "다로리인" },
    });
    expect(secondLoad.getAuthToken()).toBe("session-token");
    expect(secondLoad.getSessionUser()).toMatchObject({ id: "me" });
    expect(secondLoad.hasAuthSession()).toBe(true);
  });

  it("clears the persisted session on logout", async () => {
    mockSecureStore({
      "darori.auth.session": JSON.stringify({
        token: "session-token",
        user: {
          id: "me",
          nickname: "다로리인",
          temperature: 40.6,
          driverType: "driver",
        },
      }),
    });
    jest.resetModules();

    const { clearPersistedAuthSession, getAuthToken, hasAuthSession } = require(
      "../services/authSession",
    );

    await clearPersistedAuthSession();

    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith("darori.auth.session");
    expect(hasAuthSession()).toBe(false);
    expect(getAuthToken()).toBeUndefined();
  });
});
