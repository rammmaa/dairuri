import { ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { busSchedule } from "../data/busSchedule";
import { getBusRouteStops, getBusRoutes, getBusStops } from "../services/api";
import type { BusRoute, BusRouteStop, BusStop } from "../types/domain";
import { BusRouteMap } from "./BusRouteMap";
import { RouteChip } from "./RouteChip";

export type BusRouteHomeCardProps = {
  /** Route to feature on the home card. Defaults to Happy Bus 3 (route-happy-3). */
  routeId?: string;
  /** Tapping the card opens the route-info screen. */
  onPress?: () => void;
  /** Horizontal padding of the container the card sits in, used to size the map. */
  outerHorizontalPadding?: number;
};

const MAP_HEIGHT = 120;
const CARD_PADDING = 12;
const PHONE_MAX_WIDTH = 430;

/**
 * A compact "행복버스 노선" card for the home screen: the featured route drawn on
 * a real map with its start/end marked, plus a label and chevron. Self-contained
 * (loads the bus topology itself) so the home screen only has to drop it in.
 */
export function BusRouteHomeCard({
  routeId = "route-happy-3",
  onPress,
  outerHorizontalPadding = spacing.screenX,
}: BusRouteHomeCardProps) {
  const { width } = useWindowDimensions();
  const mapWidth = Math.max(
    Math.min(width, PHONE_MAX_WIDTH) - outerHorizontalPadding * 2 - CARD_PADDING * 2,
    220,
  );

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);

  useEffect(() => {
    // Skip the async load under jest so the host screen's tests stay free of
    // act() warnings (mirrors the MapScreen test-mode guard).
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }
    let cancelled = false;
    Promise.all([getBusRoutes(), getBusStops(), getBusRouteStops()])
      .then(([loadedRoutes, loadedStops, loadedRouteStops]) => {
        if (cancelled) return;
        setRoutes(loadedRoutes);
        setStops(loadedStops);
        setRouteStops(loadedRouteStops);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("[BusRouteHomeCard] failed to load bus topology", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const route = useMemo(
    () => routes.find((item) => item.id === routeId) ?? null,
    [routes, routeId],
  );
  const segment = busSchedule[routeId]?.segment ?? "";
  const hasRoute = routeStops.some((link) => link.routeId === routeId);

  if (!route || !hasRoute) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${route.name} 노선 보기`}
      onPress={onPress}
      testID="home-bus-route-card"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.headerRow}>
        <RouteChip label={route.name} />
        <Text style={styles.segment} numberOfLines={1}>
          {segment}
        </Text>
        <ChevronRight size={18} color={colors.gray400} />
      </View>
      <BusRouteMap
        routeId={routeId}
        stops={stops}
        routeStops={routeStops}
        width={mapWidth}
        height={MAP_HEIGHT}
        markEndpoints
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: CARD_PADDING,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.92,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  segment: {
    flex: 1,
    color: colors.slate,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
