import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors } from "../constants/colors";
import { FallbackMapSurface } from "./FallbackMapSurface";
import type { MapPreviewCamera, MapPreviewMarker } from "./mapPreviewData";

type NaverMapSurfaceProps = {
  style?: StyleProp<ViewStyle>;
  markers: MapPreviewMarker[];
  initialCamera: MapPreviewCamera;
  camera?: MapPreviewCamera;
  onMarkerPress?: (markerId: string) => void;
};

type NaverMapInstance = {
  panTo?: (center: unknown) => void;
  setCenter: (center: unknown) => void;
  setZoom: (zoom: number) => void;
};

type NaverMapMarkerInstance = {
  setMap: (map: NaverMapInstance | null) => void;
};

type NaverMapsGlobal = {
  maps?: {
    LatLng: new (latitude: number, longitude: number) => unknown;
    Marker: new (options: Record<string, unknown>) => NaverMapMarkerInstance;
    Map: new (
      element: HTMLElement,
      options: Record<string, unknown>,
    ) => NaverMapInstance;
    Event?: {
      addListener: (
        target: unknown,
        eventName: string,
        listener: () => void,
      ) => void;
    };
  };
  __dairuriNaverMapScriptPromise?: Promise<void>;
};

function getNaverMapKey() {
  const configExtra = Constants.expoConfig?.extra as
    | Record<string, unknown>
    | undefined;
  const extraKey = configExtra?.naverMapWebNcpKeyId;
  const publicKey =
    process.env.EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID?.trim() ||
    process.env.EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID?.trim();

  if (publicKey) {
    return publicKey;
  }

  return typeof extraKey === "string" ? extraKey.trim() : "";
}

function getNaverMapsGlobal() {
  return window.naver as NaverMapsGlobal | undefined;
}

function loadNaverMapScript(key: string) {
  const naver = getNaverMapsGlobal();

  if (naver?.maps) {
    return Promise.resolve();
  }

  if (window.__dairuriNaverMapScriptPromise) {
    return window.__dairuriNaverMapScriptPromise;
  }

  window.__dairuriNaverMapScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");

    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      key,
    )}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("failed to load naver map script"));
    document.head.appendChild(script);
  });

  return window.__dairuriNaverMapScriptPromise;
}

export function NaverMapSurface({
  style,
  markers,
  initialCamera,
  camera,
  onMarkerPress,
}: NaverMapSurfaceProps) {
  const mapElementRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRefs = useRef<NaverMapMarkerInstance[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const naverMapKey = getNaverMapKey();
  const setMapElement = useCallback((node: unknown) => {
    mapElementRef.current = node as HTMLElement | null;
  }, []);

  useEffect(() => {
    if (!naverMapKey) {
      setHasFailed(true);
      return;
    }

    let isMounted = true;
    let authFailureTimer: number | undefined;

    loadNaverMapScript(naverMapKey)
      .then(() => {
        const naver = getNaverMapsGlobal()?.maps;
        const element = mapElementRef.current;

        if (!isMounted || !naver || !element) {
          return;
        }

        const center = new naver.LatLng(
          initialCamera.latitude,
          initialCamera.longitude,
        );
        const map = new naver.Map(element, {
          center,
          zoom: initialCamera.zoom,
          draggable: true,
          pinchZoom: true,
          scrollWheel: true,
          keyboardShortcuts: false,
          logoControl: false,
          mapDataControl: false,
          scaleControl: false,
          zoomControl: false,
        });
        mapRef.current = map;

        setHasFailed(false);
        setIsReady(true);
        authFailureTimer = window.setTimeout(() => {
          if (!isMounted) {
            return;
          }

          const mapText = element.innerText;
          const hasAuthFailure =
            mapText.includes("인증이 실패") ||
            mapText.includes("Authentication Failed") ||
            mapText.includes("authentication failed");

          if (hasAuthFailure) {
            setHasFailed(true);
          }
        }, 1200);
      })
      .catch(() => {
        if (isMounted) {
          setHasFailed(true);
        }
      });

    return () => {
      isMounted = false;
      if (authFailureTimer) {
        window.clearTimeout(authFailureTimer);
      }
      mapRef.current = null;
    };
  }, [initialCamera, naverMapKey]);

  useEffect(() => {
    if (!isReady || !camera) {
      return;
    }

    const naver = getNaverMapsGlobal()?.maps;
    const map = mapRef.current;

    if (!naver || !map) {
      return;
    }

    const center = new naver.LatLng(camera.latitude, camera.longitude);

    if (map.panTo) {
      map.panTo(center);
    } else {
      map.setCenter(center);
    }

    map.setZoom(camera.zoom);
  }, [camera, isReady]);

  useEffect(() => {
    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    if (!isReady) {
      return;
    }

    const naver = getNaverMapsGlobal()?.maps;
    const map = mapRef.current;

    if (!naver || !map) {
      return;
    }

    markerRefs.current = markers.map((marker) => {
      const markerInstance = new naver.Marker({
        position: new naver.LatLng(marker.latitude, marker.longitude),
        map,
      });

      naver.Event?.addListener(markerInstance, "click", () => {
        onMarkerPress?.(marker.id);
      });

      return markerInstance;
    });

    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = [];
    };
  }, [isReady, markers, onMarkerPress]);

  if (hasFailed) {
    return (
      <FallbackMapSurface
        style={style}
        markers={markers}
        initialCamera={initialCamera}
        camera={camera}
        onMarkerPress={onMarkerPress}
      />
    );
  }

  return (
    <View style={[styles.container, style]} accessibilityLabel="네이버 지도">
      <View
        ref={setMapElement as never}
        testID="naver-map-web"
        style={styles.map}
      />
      {!isReady ? (
        <FallbackMapSurface
          style={StyleSheet.absoluteFill}
          markers={markers}
          initialCamera={initialCamera}
          camera={camera}
          onMarkerPress={onMarkerPress}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.mapBase,
  },
  map: {
    flex: 1,
  },
});

declare global {
  interface Window {
    naver?: NaverMapsGlobal;
    __dairuriNaverMapScriptPromise?: Promise<void>;
  }
}
