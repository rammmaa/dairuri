import { Bus, ChevronRight, MapPin } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "../components/Header";
import { RouteChip } from "../components/RouteChip";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import {
  getBusRouteStops,
  getBusRoutes,
  getBusStops,
  getStopSightings,
} from "../services/api";
import type { BusRoute, BusRouteStop, BusSighting, BusStop } from "../types/domain";

export type BusArchiveHistoryScreenProps = {
  onBack?: () => void;
};

/**
 * "아카이빙 보기" screen reached from the bus tab and from the record-complete
 * modal. A grid of the six Happy Bus routes; tapping one shows the recent
 * community sightings recorded along that route (stop, time, reporter label).
 * Replaces the ComingSoon stub.
 */
export function BusArchiveHistoryScreen({
  onBack,
}: BusArchiveHistoryScreenProps) {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [sightings, setSightings] = useState<BusSighting[]>([]);
  const [loadingSightings, setLoadingSightings] = useState(false);

  useEffect(() => {
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
        console.warn("[BusArchiveHistoryScreen] failed to load bus topology", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const stop of stops) map.set(stop.id, stop.name);
    return map;
  }, [stops]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  // When a route is picked, gather the sightings recorded at any of its stops,
  // newest first.
  useEffect(() => {
    if (!selectedRouteId) {
      setSightings([]);
      return;
    }
    let cancelled = false;
    setLoadingSightings(true);
    const stopIds = routeStops
      .filter((link) => link.routeId === selectedRouteId)
      .map((link) => link.stopId);
    Promise.all(stopIds.map((stopId) => getStopSightings(stopId).catch(() => [])))
      .then((lists) => {
        if (cancelled) return;
        const merged = lists
          .flat()
          .filter((sighting) => sighting.routeId === selectedRouteId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setSightings(merged);
      })
      .finally(() => {
        if (!cancelled) setLoadingSightings(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRouteId, routeStops]);

  const handleBack = () => {
    if (selectedRouteId) {
      setSelectedRouteId(null);
      return;
    }
    onBack?.();
  };

  return (
    <View style={styles.root}>
      <Header
        title={selectedRoute ? "기록 보기" : "아카이빙 보기"}
        showBack
        onBack={handleBack}
        border
      />

      {selectedRoute ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <RouteChip label={selectedRoute.name} />
          <Text style={styles.detailHint}>이 노선에서 기록된 버스 목격</Text>

          {loadingSightings ? (
            <Text style={styles.empty}>불러오는 중...</Text>
          ) : sightings.length === 0 ? (
            <Text style={styles.empty} testID="archive-empty">
              아직 이 노선에 기록이 없어요.
            </Text>
          ) : (
            <View style={styles.recordList}>
              {sightings.map((sighting) => (
                <View
                  key={sighting.id}
                  style={styles.recordRow}
                  testID={`archive-record-${sighting.id}`}
                >
                  <MapPin size={16} color={colors.mintDark} strokeWidth={2.2} />
                  <View style={styles.recordBody}>
                    <Text style={styles.recordStop} numberOfLines={1}>
                      {stopNameById.get(sighting.stopId) ?? sighting.stopId}
                    </Text>
                    <Text style={styles.recordMeta}>
                      {formatSightingTime(sighting.createdAt)} · 기록자 {sighting.reporterLabel}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.gridHint}>노선을 선택하면 기록을 볼 수 있어요.</Text>
          <View style={styles.grid}>
            {routes.map((route, index) => (
              <Pressable
                key={route.id}
                accessibilityRole="button"
                accessibilityLabel={`${route.name} 기록 보기`}
                onPress={() => setSelectedRouteId(route.id)}
                testID={`archive-route-card-${route.code}`}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.cardNumber}>
                  <Text style={styles.cardNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.cardName}>{route.name}</Text>
                <View style={styles.cardFooter}>
                  <Bus size={18} color={colors.mintDark} strokeWidth={2.2} />
                  <ChevronRight size={16} color={colors.gray400} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function formatSightingTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
    alignItems: "center",
  },
  gridHint: {
    alignSelf: "flex-start",
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: 14,
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 96,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    justifyContent: "space-between",
  },
  cardPressed: {
    backgroundColor: colors.mintLight,
  },
  cardNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardNumberText: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
  },
  cardName: {
    marginTop: 8,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailHint: {
    marginTop: 12,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  empty: {
    marginTop: 40,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
  },
  recordList: {
    marginTop: 18,
    width: "100%",
    gap: 10,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.line,
  },
  recordBody: {
    flex: 1,
    gap: 3,
  },
  recordStop: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  recordMeta: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
