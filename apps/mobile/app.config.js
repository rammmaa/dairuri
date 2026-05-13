const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = {
  expo: {
    name: "다로리",
    slug: "dairuri",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "com.dairuri.mobile",
      supportsTablet: false,
    },
    android: {
      package: "com.dairuri.mobile",
    },
    plugins: [
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: googleMapsApiKey,
          iosGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
    ],
  },
};
