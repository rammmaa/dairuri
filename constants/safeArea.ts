import { Platform, StatusBar } from "react-native";

export const screenTopInset =
  Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;
