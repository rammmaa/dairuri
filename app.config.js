if (!process.env.JEST_WORKER_ID) {
  require("dotenv").config({ quiet: true });
}

function firstNonEmptyEnv(keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

const splashConfig = {
  image: "./assets/splash-icon.png",
  resizeMode: "contain",
  backgroundColor: "#ffffff",
};
const naverMapNcpKeyId = firstNonEmptyEnv([
  "NAVER_MAP_NCP_KEY_ID",
  "EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID",
]);
const naverMapWebNcpKeyId =
  firstNonEmptyEnv([
    "EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID",
    "EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID",
  ]) || naverMapNcpKeyId;

module.exports = {
  expo: {
    name: "다로링크",
    slug: "dairuri",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    jsEngine: "hermes",
    splash: splashConfig,
    androidStatusBar: {
      barStyle: "dark-content",
      backgroundColor: "#ffffff",
      translucent: false,
    },
    androidNavigationBar: {
      barStyle: "dark-content",
      backgroundColor: "#ffffff",
      enforceContrast: true,
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.dairuri.app",
      buildNumber: "6",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: "com.dairuri.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      splash: splashConfig,
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-asset",
      "expo-font",
      "expo-secure-store",
      [
        "@mj-studio/react-native-naver-map",
        {
          client_id: naverMapNcpKeyId,
          android: {
            ACCESS_FINE_LOCATION: true,
            ACCESS_COARSE_LOCATION: true,
          },
          ios: {
            NSLocationWhenInUseUsageDescription:
              "현재 위치를 지도에서 확인하고 가까운 모집글을 찾기 위해 사용합니다.",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: ["https://repository.map.naver.com/archive/maven"],
          },
        },
      ],
    ],
    extra: {
      naverMapWebNcpKeyId,
      naverMapNcpKeyIdConfigured: Boolean(naverMapNcpKeyId),
      naverMapWebNcpKeyIdConfigured: Boolean(naverMapWebNcpKeyId),
      eas: {
        projectId: "686eddff-6ecf-4426-b15b-342e32d08b95",
      },
    },
  },
};
