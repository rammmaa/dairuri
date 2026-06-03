import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import type { BusRoute } from "../types/domain";

export type RouteSelectGridProps = {
  routes: BusRoute[];
  selectedRouteId: string | null;
  onSelect: (routeId: string) => void;
  /** Prefix for each chip's testID, e.g. "bus-sighting-route-chip". */
  testIDPrefix?: string;
};

/**
 * 2x3 grid of Happy Bus route chips ("1번" - "6번"). The selected chip is a
 * black fill with a yellow dot; the rest are white with a hairline outline and
 * a yellow dot. Mirrors the 2026-05-26 Figma "행복버스 노선 선택" section.
 */
export function RouteSelectGrid({
  routes,
  selectedRouteId,
  onSelect,
  testIDPrefix,
}: RouteSelectGridProps) {
  return (
    <View style={styles.grid}>
      {routes.map((route, index) => {
        const selected = route.id === selectedRouteId;
        // Derive the displayed number from the route code (H1 -> 1) so the
        // label stays correct even if the route list arrives out of order from
        // a live API; fall back to the position when the code has no digits.
        const routeNumber = Number(route.code.replace(/[^0-9]/g, "")) || index + 1;
        return (
          <Pressable
            key={route.id}
            accessibilityRole="button"
            accessibilityLabel={`${routeNumber}번 노선${selected ? " 선택됨" : ""}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(route.id)}
            testID={testIDPrefix ? `${testIDPrefix}-${route.code}` : undefined}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.chipSelected : styles.chipDeselected,
              pressed && styles.chipPressed,
            ]}
          >
            <View style={styles.dot} />
            <Text
              style={[
                styles.chipText,
                selected ? styles.chipTextSelected : styles.chipTextDeselected,
              ]}
            >
              {routeNumber}번
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    // Three columns: (100% - 2 gaps of 10) / 3. flexBasis keeps the wrap clean.
    flexGrow: 1,
    flexBasis: "30%",
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chipSelected: {
    backgroundColor: colors.black,
  },
  chipDeselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  chipPressed: {
    opacity: 0.85,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.yellow,
  },
  chipText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  chipTextSelected: {
    color: colors.surface,
  },
  chipTextDeselected: {
    color: colors.black,
  },
});
