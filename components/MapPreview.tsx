import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../constants/colors";

type MapPreviewProps = {
  style?: StyleProp<ViewStyle>;
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

type PoiMarker = {
  key: string;
  label: string;
  dotStyle: ViewStyle;
  labelStyle: ViewStyle;
};

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

const poiMarkers: PoiMarker[] = [
  {
    key: "cafe",
    label: "카페",
    dotStyle: {
      top: 258,
      left: 106,
      backgroundColor: colors.mint,
      borderColor: colors.mintDark,
    },
    labelStyle: {
      top: 232,
      left: 88,
    },
  },
  {
    key: "bus",
    label: "정류장",
    dotStyle: {
      top: 342,
      right: 92,
      backgroundColor: colors.yellow,
      borderColor: colors.yellowText,
    },
    labelStyle: {
      top: 316,
      right: 62,
    },
  },
  {
    key: "library",
    label: "도서관",
    dotStyle: {
      top: 158,
      right: 132,
      backgroundColor: colors.blue,
      borderColor: colors.surface,
    },
    labelStyle: {
      top: 132,
      right: 100,
    },
  },
];

export function MapPreview({ style, onMarkerPress }: MapPreviewProps) {
  return (
    <View style={[styles.container, style]} accessibilityLabel="지도 미리보기">
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

      {poiMarkers.map((marker) => (
        <View key={marker.key}>
          <Text style={[styles.poiLabel, marker.labelStyle]}>{marker.label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${marker.label} 마커`}
            onPress={() => onMarkerPress?.(marker.key)}
            testID={`map-preview-marker-${marker.key}`}
            style={({ pressed }) => [
              styles.poiDot,
              marker.dotStyle,
              pressed && styles.poiDotPressed,
            ]}
          />
        </View>
      ))}

      <View style={styles.currentLocation}>
        <View style={styles.locationPulse} />
        <View style={styles.locationHalo} />
        <View style={styles.locationDot} />
      </View>
    </View>
  );
}

export default MapPreview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.mapBase,
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
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.58,
  },
  poiLabel: {
    position: "absolute",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
    color: colors.slate,
    backgroundColor: colors.surface,
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.86,
  },
  poiDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  poiDotPressed: {
    opacity: 0.7,
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
