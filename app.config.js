const naverMapNcpKeyId =
  process.env.NAVER_MAP_NCP_KEY_ID ??
  process.env.EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID ??
  "";
const naverMapWebNcpKeyId =
  process.env.EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID ??
  process.env.EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID ??
  "";

module.exports = {
  expo: {
    name: "다로리",
    slug: "dairuri",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.dairuri.app",
    },
    android: {
      package: "com.dairuri.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-asset",
      "expo-font",
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
