import { Dimensions, Platform, StatusBar } from "react-native";

export const screenTopInset =
  Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

const MINIMUM_ANDROID_BOTTOM_INSET = 16;
const IOS_HOME_INDICATOR_INSET = 34;

function getAndroidBottomInset() {
  const screenHeight = Dimensions.get("screen").height;
  const windowHeight = Dimensions.get("window").height;
  const systemBottomInset = screenHeight - windowHeight - screenTopInset;

  return Math.max(MINIMUM_ANDROID_BOTTOM_INSET, systemBottomInset, 0);
}

function getIosBottomInset() {
  const { height } = Dimensions.get("screen");

  return height >= 812 ? IOS_HOME_INDICATOR_INSET : 0;
}

export const screenBottomInset =
  Platform.OS === "android"
    ? getAndroidBottomInset()
    : Platform.OS === "ios"
      ? getIosBottomInset()
      : 0;
