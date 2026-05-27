import { Bus, Clock3, MapPin, UserRound } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "../components/Header";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import {
  getBusRoutes,
  getBusStops,
  getStopSightings,
} from "../services/api";
import type { BusRoute, BusSighting, BusStop } from "../types/domain";

export type BusArchiveHistoryScreenProps = {
  onBack?: () => void;
};

type HistoryItem = {
  sighting: BusSighting;
  route?: BusRoute;
  stop?: BusStop;
};

export function BusArchiveHistoryScreen({ onBack }: BusArchiveHistoryScreenProps) {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([getBusRoutes(), getBusStops()])
      .then(async ([nextRoutes, nextStops]) => {
        const sightingsByStop = await Promise.all(
          nextStops.map((stop) => getStopSightings(stop.id, 5)),
        );

        if (!active) return;

        const routeById = new Map(nextRoutes.map((route) => [route.id, route]));
        const stopById = new Map(nextStops.map((stop) => [stop.id, stop]));
        const nextItems = sightingsByStop
          .flat()
          .map((sighting) => ({
            sighting,
            route: routeById.get(sighting.routeId),
            stop: stopById.get(sighting.stopId),
          }))
          .sort((a, b) => b.sighting.createdAt.localeCompare(a.sighting.createdAt));

        setRoutes(nextRoutes);
        setStops(nextStops);
        setItems(nextItems);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "아카이빙 기록을 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const totalLabel = useMemo(() => {
    if (items.length > 0) {
      return `최근 기록 ${items.length}건`;
    }
    return `노선 ${routes.length}개 · 정류장 ${stops.length}개`;
  }, [items.length, routes.length, stops.length]);

  return (
    <View style={styles.root}>
      <Header title="아카이빙 보기" showBack onBack={onBack} border />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Bus size={22} color={colors.mintDark} strokeWidth={2.4} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>행복버스 목격 로그</Text>
            <Text style={styles.summaryTitle}>{totalLabel}</Text>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {items.length > 0 ? (
          <View style={styles.historyList}>
            {items.map((item) => (
              <HistoryCard key={item.sighting.id} item={item} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Clock3 size={26} color={colors.gray400} strokeWidth={2.2} />
            <Text style={styles.emptyTitle}>아직 기록된 목격 로그가 없어요</Text>
            <Text style={styles.emptyDescription}>
              버스를 보면 기록하기에서 첫 로그를 남길 수 있어요.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.routeCode}>
          <Text style={styles.routeCodeText}>{item.route?.code ?? "?"}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.routeName}>
            {item.route?.name ?? item.sighting.routeId}
          </Text>
          <Text style={styles.createdAt}>{formatAbsoluteTime(item.sighting.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <MapPin size={14} color={colors.mintDark} strokeWidth={2.4} />
        <Text style={styles.metaText}>{item.stop?.name ?? item.sighting.stopId}</Text>
      </View>
      <View style={styles.metaRow}>
        <UserRound size={14} color={colors.grayIcon} strokeWidth={2.4} />
        <Text style={styles.metaText}>기록자 {item.sighting.reporterLabel}</Text>
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
  historyList: {
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeCode: {
    minWidth: 42,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  routeCodeText: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  routeName: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  createdAt: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  metaRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  emptyCard: {
    minHeight: 188,
    padding: 24,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
});
