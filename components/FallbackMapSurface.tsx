import { useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import type { MapPreviewCamera, MapPreviewMarker } from "./mapPreviewData";

type FallbackMapSurfaceProps = {
  style?: StyleProp<ViewStyle>;
  markers: MapPreviewMarker[];
  initialCamera: MapPreviewCamera;
  camera?: MapPreviewCamera;
  onMarkerPress?: (markerId: string) => void;
};

type RoadSegment = {
  key: string;
  style: ViewStyle;
};

type MapLabel = {
  key: string;
  label: string;
  style: ViewStyle;
};

const PAN_LIMIT = 140;
const FALLBACK_MAP_WIDTH = 390;
const FALLBACK_MAP_HEIGHT = 540;
const MARKER_SIZE = 34;
const MARKER_SCALE = 9000;

const routeSegments: RoadSegment[] = [
  {
    key: "northwest-curve",
    style: {
      top: 58,
      left: -46,
      width: 260,
      transform: [{ rotate: "-24deg" }],
    },
  },
  {
    key: "central-diagonal",
    style: {
      top: 224,
      left: 78,
      width: 342,
      transform: [{ rotate: "-35deg" }],
    },
  },
  {
    key: "southwest-diagonal",
    style: {
      top: 390,
      left: -72,
      width: 340,
      transform: [{ rotate: "-18deg" }],
    },
  },
  {
    key: "east-diagonal",
    style: {
      top: 112,
      right: -94,
      width: 290,
      transform: [{ rotate: "42deg" }],
    },
  },
];

const minorRoads: RoadSegment[] = [
  {
    key: "upper-horizontal",
    style: {
      top: 146,
      left: -20,
      width: 450,
      transform: [{ rotate: "5deg" }],
    },
  },
  {
    key: "middle-horizontal",
    style: {
      top: 286,
      left: -40,
      width: 470,
      transform: [{ rotate: "-4deg" }],
    },
  },
  {
    key: "lower-horizontal",
    style: {
      top: 462,
      left: -26,
      width: 430,
      transform: [{ rotate: "7deg" }],
    },
  },
  {
    key: "left-vertical",
    style: {
      top: 36,
      left: 72,
      width: 420,
      transform: [{ rotate: "77deg" }],
    },
  },
  {
    key: "right-vertical",
    style: {
      top: 64,
      right: -102,
      width: 440,
      transform: [{ rotate: "83deg" }],
    },
  },
];

const labels: MapLabel[] = [
  {
    key: "campus-road",
    label: "다로리로",
    style: {
      top: 170,
      left: 26,
      transform: [{ rotate: "5deg" }],
    },
  },
  {
    key: "station-road",
    label: "중앙대로",
    style: {
      top: 300,
      right: 54,
      transform: [{ rotate: "-36deg" }],
    },
  },
  {
    key: "cafe-road",
    label: "카페거리",
    style: {
      top: 424,
      left: 110,
      transform: [{ rotate: "-18deg" }],
    },
  },
];

function clampPan(value: number) {
  return Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, value));
}

export function FallbackMapSurface({
  style,
  markers,
  initialCamera,
  camera,
  onMarkerPress,
}: FallbackMapSurfaceProps) {
  const activeCamera = camera ?? initialCamera;
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          startOffsetRef.current = panOffset;
        },
        onPanResponderMove: (event, gestureState) => {
          const eventWithTouchHistory = event as typeof event & {
            touchHistory?: {
              indexOfSingleActiveTouch: number;
              touchBank?: Array<{
                previousPageX: number;
                previousPageY: number;
              }>;
            };
          };
          const touch = event.nativeEvent.changedTouches?.[0];
          const touchHistory = eventWithTouchHistory.touchHistory?.touchBank?.[
            eventWithTouchHistory.touchHistory.indexOfSingleActiveTouch
          ];
          const dx =
            gestureState.dx ||
            (touch && touchHistory
              ? touch.pageX - touchHistory.previousPageX
              : 0);
          const dy =
            gestureState.dy ||
            (touch && touchHistory
              ? touch.pageY - touchHistory.previousPageY
              : 0);

          setPanOffset({
            x: clampPan(startOffsetRef.current.x + dx),
            y: clampPan(startOffsetRef.current.y + dy),
          });
        },
      }),
    [panOffset],
  );

  return (
    <View style={[styles.container, style]} accessibilityLabel="지도 미리보기">
      <View
        {...panResponder.panHandlers}
        testID="map-preview-pan-layer"
        style={[
          styles.panLayer,
          {
            transform: [
              { translateX: panOffset.x },
              { translateY: panOffset.y },
            ],
          },
        ]}
      >
        <View style={styles.water} />
        <View style={styles.parkOne} />
        <View style={styles.parkTwo} />

        {minorRoads.map((road) => (
          <View key={road.key} style={[styles.minorRoad, road.style]} />
        ))}

        {routeSegments.map((road) => (
          <View key={road.key} style={[styles.routeRoad, road.style]}>
            <View style={styles.routeRoadLine} />
          </View>
        ))}

        <View style={styles.curvedRoad}>
          <View style={styles.curvedRoadInner} />
        </View>

        {labels.map((item) => (
          <Text key={item.key} style={[styles.roadLabel, item.style]}>
            {item.label}
          </Text>
        ))}

        <View style={styles.currentLocation}>
          <View style={styles.locationPulse} />
          <View style={styles.locationHalo} />
          <View style={styles.locationDot} />
        </View>

        {markers.map((marker) => {
          const position = projectMarkerPosition(marker, activeCamera);

          return (
            <Pressable
              key={marker.id}
              accessibilityRole="button"
              accessibilityLabel={`${marker.label} 지도 핀`}
              onPress={() => onMarkerPress?.(marker.id)}
              testID={`map-preview-marker-${marker.id}`}
              style={({ pressed }) => [
                styles.markerPin,
                position,
                pressed && styles.markerPinPressed,
              ]}
            >
              <View style={styles.markerDot} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function projectMarkerPosition(
  marker: MapPreviewMarker,
  camera: MapPreviewCamera,
): ViewStyle {
  const rawLeft =
    FALLBACK_MAP_WIDTH / 2 +
    (marker.longitude - camera.longitude) * MARKER_SCALE -
    MARKER_SIZE / 2;
  const rawTop =
    FALLBACK_MAP_HEIGHT / 2 -
    (marker.latitude - camera.latitude) * MARKER_SCALE -
    MARKER_SIZE;

  return {
    left: Math.max(14, Math.min(FALLBACK_MAP_WIDTH - MARKER_SIZE - 14, rawLeft)),
    top: Math.max(86, Math.min(FALLBACK_MAP_HEIGHT - MARKER_SIZE - 108, rawTop)),
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.mapBase,
  },
  panLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  water: {
    position: "absolute",
    top: -44,
    right: -70,
    width: 196,
    height: 260,
    borderRadius: 98,
    backgroundColor: colors.mapWater,
    opacity: 0.5,
    transform: [{ rotate: "-26deg" }],
  },
  parkOne: {
    position: "absolute",
    top: 92,
    left: -36,
    width: 150,
    height: 118,
    borderRadius: 40,
    backgroundColor: colors.mintLight,
    opacity: 0.7,
    transform: [{ rotate: "18deg" }],
  },
  parkTwo: {
    position: "absolute",
    right: 18,
    bottom: 74,
    width: 170,
    height: 96,
    borderRadius: 36,
    backgroundColor: colors.yellowLight,
    opacity: 0.55,
    transform: [{ rotate: "-16deg" }],
  },
  minorRoad: {
    position: "absolute",
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.mapRoad,
    borderWidth: 1,
    borderColor: colors.mapRoadLine,
    opacity: 0.82,
  },
  routeRoad: {
    position: "absolute",
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mapRoad,
    borderWidth: 1,
    borderColor: colors.mapRoadLine,
    justifyContent: "center",
  },
  routeRoadLine: {
    height: 2,
    marginHorizontal: 18,
    borderRadius: 1,
    backgroundColor: colors.mapRoadLine,
  },
  curvedRoad: {
    position: "absolute",
    top: 180,
    left: -38,
    width: 260,
    height: 170,
    borderTopWidth: 28,
    borderRightWidth: 28,
    borderColor: colors.mapRoad,
    borderTopRightRadius: 120,
    transform: [{ rotate: "-12deg" }],
  },
  curvedRoadInner: {
    position: "absolute",
    top: -16,
    right: -16,
    width: 222,
    height: 132,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.mapRoadLine,
    borderTopRightRadius: 96,
  },
  roadLabel: {
    position: "absolute",
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    opacity: 0.58,
  },
  currentLocation: {
    position: "absolute",
    top: 238,
    left: 180,
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  markerPin: {
    position: "absolute",
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mint,
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  markerPinPressed: {
    opacity: 0.82,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mintDark,
  },
  locationPulse: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.blueSoft,
  },
  locationHalo: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    opacity: 0.92,
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.blue,
  },
});
