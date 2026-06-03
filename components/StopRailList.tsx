import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import type { BusStop } from "../types/domain";

export type StopRailListProps = {
  /** Stops in route sequence order. */
  stops: BusStop[];
  selectedStopId: string | null;
  onSelect: (stopId: string) => void;
  /** Prefix for each row's testID, e.g. "bus-sighting-stop-row". */
  testIDPrefix?: string;
};

/**
 * Vertical stop list with a yellow connector rail. Each row is a circle on the
 * rail plus the stop name; the selected row fills its circle and tints the row.
 * Matches the 2026-05-26 Figma "행복버스 정류장 선택" rail. The list renders its
 * rows only; the consumer wraps it in a ScrollView so the rail can scroll while
 * a sticky route grid stays anchored above it.
 */
export function StopRailList({
  stops,
  selectedStopId,
  onSelect,
  testIDPrefix,
}: StopRailListProps) {
  return (
    <View style={styles.list}>
      {stops.map((stop, index) => {
        const selected = stop.id === selectedStopId;
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        return (
          <Pressable
            key={stop.id}
            accessibilityRole="button"
            accessibilityLabel={`${stop.name} 정류장 선택`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(stop.id)}
            testID={testIDPrefix ? `${testIDPrefix}-${stop.id}` : undefined}
            style={({ pressed }) => [
              styles.row,
              selected && styles.rowSelected,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.railCol}>
              <View
                style={[styles.railLine, isFirst && styles.railLineHidden]}
              />
              <View
                style={[styles.circle, selected && styles.circleSelected]}
              />
              <View
                style={[styles.railLine, isLast && styles.railLineHidden]}
              />
            </View>
            <Text
              style={[styles.name, selected && styles.nameSelected]}
              numberOfLines={1}
            >
              {stop.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 12,
    borderRadius: 10,
  },
  rowSelected: {
    backgroundColor: colors.yellowLight,
  },
  rowPressed: {
    opacity: 0.7,
  },
  railCol: {
    width: 28,
    alignSelf: "stretch",
    alignItems: "center",
  },
  railLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.yellow,
  },
  railLineHidden: {
    backgroundColor: "transparent",
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.yellow,
    backgroundColor: colors.surface,
  },
  circleSelected: {
    backgroundColor: colors.yellow,
  },
  name: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  nameSelected: {
    fontFamily: typography.family.bold,
  },
});
