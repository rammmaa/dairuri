import { StyleSheet, Text, View } from "react-native";
import type { DairuriMapProps } from "./DairuriMap.types";
import { colors } from "../../theme/tokens";

export function DairuriMap({ rides }: DairuriMapProps) {
  return (
    <View accessibilityLabel="다로리 주변 지도" style={styles.webMap}>
      <View style={[styles.road, styles.primaryRoad]} />
      <View style={[styles.road, styles.secondaryRoad]} />
      <View style={[styles.road, styles.tertiaryRoad]} />
      <View style={styles.waterLine} />
      {rides.map((ride, index) => (
        <View
          key={ride.id}
          style={[
            styles.marker,
            {
              left: `${30 + index * 18}%`,
              top: `${36 + index * 14}%`,
            },
          ]}
        >
          <View style={styles.markerDot} />
          <Text numberOfLines={1} style={styles.markerLabel}>
            {ride.departureName}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.mapBackground,
    overflow: "hidden",
  },
  road: {
    position: "absolute",
    height: 22,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.mapRoadBorder,
  },
  primaryRoad: {
    top: 190,
    left: -40,
    right: -30,
    transform: [{ rotate: "-32deg" }],
  },
  secondaryRoad: {
    top: 330,
    left: -80,
    width: 520,
    transform: [{ rotate: "-58deg" }],
  },
  tertiaryRoad: {
    top: 90,
    left: 160,
    width: 370,
    transform: [{ rotate: "22deg" }],
  },
  waterLine: {
    position: "absolute",
    top: 250,
    left: 142,
    width: 310,
    height: 9,
    borderRadius: 8,
    backgroundColor: colors.water,
    transform: [{ rotate: "-58deg" }],
  },
  marker: {
    position: "absolute",
    maxWidth: 160,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  markerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.active,
  },
  markerLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
});
