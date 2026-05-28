describe("Naver Maps Expo config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses the configured Naver map key for native and web map surfaces", () => {
    process.env.NAVER_MAP_NCP_KEY_ID = "ncp-key-for-tests";
    delete process.env.EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID;
    delete process.env.EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID;

    const config = require("../app.config.js");
    const naverPlugin = config.expo.plugins.find(
      (plugin: unknown) =>
        Array.isArray(plugin) && plugin[0] === "@mj-studio/react-native-naver-map",
    );

    expect(naverPlugin?.[1].client_id).toBe("ncp-key-for-tests");
    expect(config.expo.extra.naverMapWebNcpKeyId).toBe("ncp-key-for-tests");
    expect(config.expo.extra.naverMapWebNcpKeyIdConfigured).toBe(true);
  });

  it("keeps Android content below the system status bar in installed APKs", () => {
    const config = require("../app.config.js");

    expect(config.expo.android.edgeToEdgeEnabled).toBe(false);
  });

  it("uses the Darolink Korean display name for installed apps", () => {
    const config = require("../app.config.js");

    expect(config.expo.name).toBe("다로링크");
  });
});
