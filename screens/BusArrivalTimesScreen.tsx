import { Bus, Clock3, MapPin } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "../components/Header";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { formatLastSightingLabel } from "../data/busSightingFormat";
import { getBusRoutes, getBusRouteStops, getBusStops } from "../services/api";
import type { BusRoute, BusRouteStop, BusStop } from "../types/domain";

export type BusArrivalTimesScreenProps = {
  onBack?: () => void;
};

export function BusArrivalTimesScreen({ onBack }: BusArrivalTimesScreenProps) {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getBusRoutes(), getBusStops(), getBusRouteStops()])
      .then(([nextRoutes, nextStops, nextRouteStops]) => {
        if (!active) return;
        setRoutes(nextRoutes);
        setStops(nextStops);
        setRouteStops(nextRouteStops);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "도착 기록을 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const routeCodesByStopId = useMemo(() => {
    const routeById = new Map(routes.map((route) => [route.id, route]));
    const codes = new Map<string, string[]>();

    for (const link of routeStops) {
      const route = routeById.get(link.routeId);
      if (!route) continue;
      const current = codes.get(link.stopId) ?? [];
      current.push(route.code);
      codes.set(link.stopId, current);
    }

    return codes;
  }, [routes, routeStops]);

  const visibleStops = useMemo(
    () =>
      [...stops].sort((a, b) => {
        if (!a.lastSightingAt && !b.lastSightingAt) return a.name.localeCompare(b.name);
        if (!a.lastSightingAt) return 1;
        if (!b.lastSightingAt) return -1;
        return b.lastSightingAt.localeCompare(a.lastSightingAt);
      }),
    [stops],
  );

  return (
    <View style={styles.root}>
      <Header title="버스 도착 기록" showBack onBack={onBack} border />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Clock3 size={22} color={colors.mintDark} strokeWidth={2.4} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>정류장별 최근 목격 기준</Text>
            <Text style={styles.summaryTitle}>총 {visibleStops.length}개 정류장</Text>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.list}>
          {visibleStops.map((stop) => (
            <ArrivalStopCard
              key={stop.id}
              stop={stop}
              routeCodes={routeCodesByStopId.get(stop.id) ?? []}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ArrivalStopCard({
  stop,
  routeCodes,
}: {
  stop: BusStop;
  routeCodes: string[];
}) {
  const freshLabel = formatLastSightingLabel(stop.lastSightingAt);
  const timeLabel = stop.lastSightingAt
    ? freshLabel ?? formatAbsoluteTime(stop.lastSightingAt)
    : "기록 없음";

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.stopIcon}>
          <MapPin size={16} color={colors.mintDark} strokeWidth={2.4} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.stopName}>{stop.name}</Text>
          <Text style={styles.routeCodes}>
            {routeCodes.length > 0 ? routeCodes.join(" · ") : "노선 미지정"}
          </Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <Bus size={15} color={colors.blue} strokeWidth={2.4} />
        <Text style={styles.timeText}>{timeLabel}</Text>
      </View>
    </View>
  );
}

function formatAbsoluteTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "기록 시간 확인 불가";
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.sheet,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  summaryCard: {
    minHeight: 76,
    padding: 16,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  summaryLabel: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  summaryTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  list: {
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stopIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  stopName: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  routeCodes: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  timeRow: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.blueSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    color: colors.blue,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
});
