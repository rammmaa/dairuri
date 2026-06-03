import { Platform } from "react-native";
import type { ComponentType } from "react";

import { FallbackMapSurface } from "./FallbackMapSurface";
import type { NaverMapSurfaceProps } from "./NativeNaverMapSurface";

type NaverMapSurfaceRuntime = {
  platform: string;
  nodeEnv?: string;
  forceFallbackMap?: string;
};

let NativeSurface: ComponentType<NaverMapSurfaceProps> | undefined;

export function shouldUseNativeNaverMap({
  platform,
  nodeEnv,
  forceFallbackMap,
}: NaverMapSurfaceRuntime) {
  return platform !== "web" && nodeEnv !== "test" && forceFallbackMap !== "true";
}

if (
  shouldUseNativeNaverMap({
    platform: Platform.OS,
    nodeEnv: process.env.NODE_ENV,
    forceFallbackMap: process.env.EXPO_PUBLIC_DARORI_FORCE_FALLBACK_MAP,
  })
) {
  NativeSurface = require("./NativeNaverMapSurface").NativeNaverMapSurface;
}

export function NaverMapSurface(props: NaverMapSurfaceProps) {
  const Surface = NativeSurface ?? FallbackMapSurface;

  return <Surface {...props} />;
}
