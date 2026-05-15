import { Platform } from "react-native";
import type { ComponentType } from "react";

import { FallbackMapSurface } from "./FallbackMapSurface";
import type { NaverMapSurfaceProps } from "./NativeNaverMapSurface";

let NativeSurface: ComponentType<NaverMapSurfaceProps> | undefined;

if (Platform.OS !== "web" && process.env.NODE_ENV !== "test") {
  NativeSurface = require("./NativeNaverMapSurface").NativeNaverMapSurface;
}

export function NaverMapSurface(props: NaverMapSurfaceProps) {
  const Surface = NativeSurface ?? FallbackMapSurface;

  return <Surface {...props} />;
}
