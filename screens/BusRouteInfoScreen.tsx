import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { BusRouteMap } from "../components/BusRouteMap";
import { Header } from "../components/Header";
import { RouteChip } from "../components/RouteChip";
import { RouteSelectGrid } from "../components/RouteSelectGrid";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { busRouteInfo } from "../data/busRouteInfo";
import { getBusRouteStops, getBusRoutes, getBusStops } from "../services/api";
import type { BusRoute, BusRouteStop, BusStop } from "../types/domain";

export type BusRouteInfoScreenProps = {
  onBack?: () => void;
};

const MAP_HEIGHT = 230;

/**
 * "청도 행복버스" route-info screen reached from the (i) icon in the bus archive
 * header (2026-06-06 frames). Shows a route picker, the selected route drawn on
 * a real map (start / end emphasized, the other routes faint underneath), the
 * route's schedule, and its full stop sequence. Replaces the ComingSoon stub.
 */
export function BusRouteInfoScreen({ onBack }: BusRouteInfoScreenProps) {
  const { width } = useWindowDimensions();
  const mapWidth = Math.max(Math.min(width, 430) - spacing.screenX * 2, 220);

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBusRoutes(), getBusStops(), getBusRouteStops()])
      .then(([loadedRoutes, loadedStops, loadedRouteStops]) => {
        if (cancelled) return;
        setRoutes(loadedRoutes);
        setStops(loadedStops);
        setRouteStops(loadedRouteStops);
        setSelectedRouteId(
          (current) =>
            current ??
            loadedRoutes.find((route) => route.code === "H1")?.id ??
            loadedRoutes[0]?.id ??
            null,
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("[BusRouteInfoScreen] failed to load bus topology", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );
  const info = selectedRouteId ? busRouteInfo[selectedRouteId] : null;
  const orderedStops = useMemo<BusStop[]>(() => {
    if (!selectedRouteId) return [];
    return routeStops
      .filter((link) => link.routeId === selectedRouteId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((link) => stops.find((stop) => stop.id === link.stopId))
      .filter((stop): stop is BusStop => Boolean(stop));
  }, [selectedRouteId, routeStops, stops]);
  const otherRouteIds = useMemo(
    () => routes.map((route) => route.id).filter((id) => id !== selectedRouteId),
    [routes, selectedRouteId],
  );

  return (
    <View style={styles.root}>
      <Header title="청도 행복버스" showBack onBack={onBack} border />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>행복버스 노선 선택 (1번 - 6번)</Text>
        <RouteSelectGrid
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelect={setSelectedRouteId}
          testIDPrefix="route-info-chip"
        />

        {selectedRouteId ? (
          <View style={styles.mapWrap}>
            <BusRouteMap
              routeId={selectedRouteId}
              stops={stops}
              routeStops={routeStops}
              width={mapWidth}
              height={MAP_HEIGHT}
              markEndpoints
              backgroundRouteIds={otherRouteIds}
            />
            <View style={styles.legendRow}>
              <Legend color={colors.mintDark} label="기점" />
              <Legend color={colors.red} label="종점" />
              <Legend color={colors.gray400} label="다른 노선" />
            </View>
          </View>
        ) : null}

        {selectedRoute && info ? (
          <View style={styles.infoCard}>
            <RouteChip label={selectedRoute.name} />
            <View style={styles.infoTable}>
              <InfoRow label="기점" value={info.origin} />
              <InfoRow label="종점" value={info.terminus} />
              <InfoRow label="첫차" value={info.firstBus} />
              <InfoRow label="막차" value={info.lastBus} />
              <InfoRow label="배차간격" value={info.runsPerDay} />
              <InfoRow label="운수사" value={info.operator} />
              <InfoRow label="인가대수" value={info.vehicles} />
            </View>
          </View>
        ) : null}

        {orderedStops.length > 0 ? (
          <View style={styles.stopsCard}>
            <Text style={styles.stopsTitle}>정류장 ({orderedStops.length}개)</Text>
            {orderedStops.map((stop, index) => (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.stopMarkerCol}>
                  <View
                    style={[
                      styles.stopLine,
                      index === 0 && styles.stopLineHidden,
                    ]}
                  />
                  <View style={styles.stopDot} />
                  <View
                    style={[
                      styles.stopLine,
                      index === orderedStops.length - 1 && styles.stopLineHidden,
                    ]}
                  />
                </View>
                <Text style={styles.stopName} numberOfLines={1}>
                  {stop.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    color: colors.grayText,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: 10,
  },
  mapWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  legendRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 16,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  infoCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTable: {
    marginTop: 14,
    width: "100%",
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoLabel: {
    width: 64,
    color: colors.grayText,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  infoValue: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  stopsCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stopsTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    marginBottom: 8,
  },
  stopRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stopMarkerCol: {
    width: 20,
    alignSelf: "stretch",
    alignItems: "center",
  },
  stopLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.mint,
  },
  stopLineHidden: {
    backgroundColor: "transparent",
  },
  stopDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: colors.mintDark,
    backgroundColor: colors.surface,
  },
  stopName: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
