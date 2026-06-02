describe("Naver Maps Expo config", () => {
  const originalEnv = process.env;
  const naverMapPluginId = "@mj-studio/react-native-naver-map";

  function loadConfig() {
    return require("../app.config.js");
  }

  function getNaverPlugin(config: { expo: { plugins: unknown[] } }) {
    const plugin = config.expo.plugins.find(
      (candidate: unknown) =>
        Array.isArray(candidate) && candidate[0] === naverMapPluginId,
    );

    if (!Array.isArray(plugin)) {
      throw new Error("Naver map config plugin is missing");
    }

    return plugin;
  }

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

    const config = loadConfig();
    const naverPlugin = getNaverPlugin(config);

    expect(naverPlugin?.[1].client_id).toBe("ncp-key-for-tests");
    expect(config.expo.extra.naverMapWebNcpKeyId).toBe("ncp-key-for-tests");
    expect(config.expo.extra.naverMapWebNcpKeyIdConfigured).toBe(true);
  });

  it("falls back to the public native Naver key when the native env value is blank", () => {
    process.env.NAVER_MAP_NCP_KEY_ID = "   ";
    process.env.EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID = " public-native-key ";
    process.env.EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID = " web-key ";

    const config = loadConfig();
    const naverPlugin = getNaverPlugin(config);

    expect(naverPlugin[1].client_id).toBe("public-native-key");
    expect(config.expo.extra.naverMapWebNcpKeyId).toBe("web-key");
    expect(config.expo.extra.naverMapNcpKeyIdConfigured).toBe(true);
    expect(config.expo.extra.naverMapWebNcpKeyIdConfigured).toBe(true);
  });

  it("treats blank Naver map env values as unconfigured", () => {
    process.env.NAVER_MAP_NCP_KEY_ID = " ";
    process.env.EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID = "";
    process.env.EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID = "   ";

    const config = loadConfig();
    const naverPlugin = getNaverPlugin(config);

    expect(naverPlugin[1].client_id).toBe("");
    expect(config.expo.extra.naverMapWebNcpKeyId).toBe("");
    expect(config.expo.extra.naverMapNcpKeyIdConfigured).toBe(false);
    expect(config.expo.extra.naverMapWebNcpKeyIdConfigured).toBe(false);
  });

  it("keeps Android content below the system status bar in installed APKs", () => {
    const config = loadConfig();

    expect(config.expo.android.edgeToEdgeEnabled).toBe(false);
  });

  it("declares Android system bar and splash config for managed builds", () => {
    const config = loadConfig();

    expect(config.expo.jsEngine).toBe("hermes");
    expect(config.expo.androidStatusBar).toEqual({
      barStyle: "dark-content",
      backgroundColor: "#ffffff",
      translucent: false,
    });
    expect(config.expo.androidNavigationBar).toEqual({
      barStyle: "dark-content",
      backgroundColor: "#ffffff",
      enforceContrast: true,
    });
    expect(config.expo.android.splash).toEqual({
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    });
  });

  it("resolves only foreground Android location permissions from the Naver map plugin", () => {
    const { getConfig } = require("@expo/config");
    const config = getConfig(process.cwd(), { isPublicConfig: true }).exp;

    expect(config.android.permissions).toEqual([
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
    ]);
  });

  it("uses the Darolink Korean display name for installed apps", () => {
    const config = loadConfig();

    expect(config.expo.name).toBe("다로링크");
  });
});
