import { useContext } from "react";
import {
  SafeAreaInsetsContext,
  type EdgeInsets,
} from "react-native-safe-area-context";

const zeroInsets: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

export function useRuntimeSafeAreaInsets() {
  return useContext(SafeAreaInsetsContext) ?? zeroInsets;
}

export function getSafeAreaTopInset(insets: EdgeInsets) {
  return Math.max(insets.top, 0);
}

export function getSafeAreaBottomInset(insets: EdgeInsets) {
  return Math.max(insets.bottom, 0);
}
