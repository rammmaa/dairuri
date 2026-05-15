import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import {
  NaverMapMarkerOverlay,
  NaverMapView,
} from "@mj-studio/react-native-naver-map";

import { colors } from "../constants/colors";
import type { MapPreviewCamera, MapPreviewMarker } from "./mapPreviewData";

export type NaverMapSurfaceProps = {
  style?: StyleProp<ViewStyle>;
  markers: MapPreviewMarker[];
  initialCamera: MapPreviewCamera;
  onMarkerPress?: (markerId: string) => void;
};

export function NativeNaverMapSurface({
  style,
  markers,
  initialCamera,
  onMarkerPress,
}: NaverMapSurfaceProps) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel="네이버 지도"
      testID="naver-map-native"
    >
      <NaverMapView
        style={styles.map}
        initialCamera={initialCamera}
        locale="ko"
        isExtentBoundedInKorea
        isScrollGesturesEnabled
        isZoomGesturesEnabled
        isTiltGesturesEnabled
        isRotateGesturesEnabled
        isStopGesturesEnabled
        isShowScaleBar={false}
        isShowZoomControls={false}
        isShowCompass={false}
        mapPadding={{ top: 126, right: 16, bottom: 220, left: 16 }}
        locationOverlay={{
          isVisible: true,
          position: {
            latitude: initialCamera.latitude,
            longitude: initialCamera.longitude,
          },
          circleRadius: 42,
          circleColor: colors.blueSoft,
          circleOutlineWidth: 0,
        }}
      >
        {markers.map((marker) => (
          <NaverMapMarkerOverlay
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            caption={{
              text: marker.label,
              textSize: 13,
              color: colors.slate,
              haloColor: colors.surface,
            }}
            onTap={() => onMarkerPress?.(marker.id)}
          />
        ))}
      </NaverMapView>
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
