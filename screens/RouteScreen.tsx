import { Bus, Clock3, MapPin, Search, Timer } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BottomNav } from "../components/BottomNav";
import { FilterChip } from "../components/FilterChip";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { formatLastSightingLabel } from "../data/busSightingFormat";
import { bottomNavItems, type BottomNavItem } from "../data/mapHome";
import { getBusRoutes } from "../services/api";
import type { BusRoute } from "../types/domain";

export type RouteScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenBusSighting?: () => void;
};

type RouteStatus = "운행중" | "곧 도착" | "배차대기";

type RouteCardData = {
  id: string;
  routeName: string;
  routeNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  departureMinutes: number;
  duration: string;
  durationMinutes: number;
  status: RouteStatus;
  isExpress?: boolean;
};

const routeFilters = ["전체", "운행중", "곧 도착", "급행"] as const;
type RouteFilter = (typeof routeFilters)[number];
type RouteSort = "빠른순" | "출발순" | "상태순";
const routeSortOptions: RouteSort[] = ["빠른순", "출발순", "상태순"];

const routeCards: RouteCardData[] = [
  {
    id: "campus-loop",
    routeName: "다이루리 순환",
    routeNumber: "D-01",
    departure: "다로리 카페",
    arrival: "중앙 정류장",
    departureTime: "08:12 출발",
    departureMinutes: 492,
    duration: "12분",
    durationMinutes: 12,
    status: "운행중",
  },
  {
    id: "station-shuttle",
    routeName: "역 앞 셔틀",
    routeNumber: "D-03",
    departure: "다로리역 2번 출구",
    arrival: "커뮤니티 센터",
    departureTime: "08:20 출발",
    departureMinutes: 500,
    duration: "8분",
    durationMinutes: 8,
    status: "곧 도착",
    isExpress: true,
  },
  {
    id: "late-night",
    routeName: "야간 귀가",
    routeNumber: "N-10",
    departure: "중앙 정류장",
    arrival: "기숙사 동문",
    departureTime: "22:40 출발",
    departureMinutes: 1360,
    duration: "18분",
    durationMinutes: 18,
    status: "배차대기",
  },
];

export function RouteScreen({ onSelectTab, onOpenBusSighting }: RouteScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<RouteFilter>("전체");
  const [selectedSort, setSelectedSort] = useState<RouteSort>("빠른순");

  // Pull the community-sighted routes so we can annotate the static prototype
  // cards with a last-seen badge. The route number on the static card
  // (e.g. "D-01") is matched against the BusRoute.code we get back. Routes
  // that have no recorded sighting (or that do not exist in the archive at
  // all, such as the prototype's "N-10") simply render without a badge.
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  useEffect(() => {
    let cancelled = false;
    void getBusRoutes().then((routes) => {
      if (!cancelled) {
        setBusRoutes(routes);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lastSightingByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const route of busRoutes) {
      if (route.lastSightingAt) {
        map.set(route.code, route.lastSightingAt);
      }
    }
    return map;
  }, [busRoutes]);

  const visibleRoutes = useMemo(() => {
    const filtered = routeCards.filter((route) => {
      if (selectedFilter === "전체") {
        return true;
      }

      if (selectedFilter === "급행") {
        return route.isExpress === true;
      }

      return route.status === selectedFilter;
    });

    return [...filtered].sort((a, b) => {
      if (selectedSort === "출발순") {
        return a.departureMinutes - b.departureMinutes;
      }

      if (selectedSort === "상태순") {
        return statusPriority(a.status) - statusPriority(b.status);
      }

      return a.durationMinutes - b.durationMinutes;
    });
  }, [selectedFilter, selectedSort]);
  const summaryRoute = visibleRoutes[0] ?? routeCards[0];

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>버스</Text>
            {onOpenBusSighting ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="방금 버스 봤어요"
                onPress={onOpenBusSighting}
                testID="route-record-sighting-button"
                style={({ pressed }) => [
                  styles.recordSightingButton,
                  pressed && styles.recordSightingButtonPressed,
                ]}
              >
                <Bus size={16} color={colors.surface} strokeWidth={2.4} />
                <Text style={styles.recordSightingText}>방금 봤어요</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.searchBar} accessibilityRole="search">
            <Search size={20} color={colors.grayIcon} strokeWidth={2.3} />
            <Text style={styles.searchPlaceholder}>노선, 정류장 검색</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {routeFilters.map((filter) => (
            <FilterChip
              key={filter}
              label={filter}
              compact
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
              testID={`route-filter-${filter}`}
            />
          ))}
        </View>

        <View style={styles.sortRow}>
          {routeSortOptions.map((sort) => (
            <FilterChip
              key={sort}
              label={sort}
              compact
              selected={selectedSort === sort}
              onPress={() => setSelectedSort(sort)}
              testID={`route-sort-${sort}`}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconFrame}>
              <Bus size={22} color={colors.mintDark} strokeWidth={2.4} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>가장 빠른 노선</Text>
              <Text style={styles.summaryTitle}>
                {summaryRoute.routeName} · {summaryRoute.duration}
              </Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{summaryRoute.status}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>추천 경로</Text>
            <Text style={styles.sectionMeta}>{visibleRoutes.length}개 노선</Text>
          </View>

          <View style={styles.cardList}>
            {visibleRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                lastSightingAt={lastSightingByCode.get(route.routeNumber)}
              />
            ))}
          </View>
        </ScrollView>

        <BottomNav
          items={bottomNavItems}
          selectedId="bus"
          onSelect={onSelectTab}
          testID="route-bottom-nav"
        />
      </View>
    </View>
  );
}

function statusPriority(status: RouteStatus) {
  if (status === "운행중") {
    return 0;
  }

  if (status === "곧 도착") {
    return 1;
  }

  return 2;
}

type RouteCardProps = {
  route: RouteCardData;
  /** ISO timestamp of the most recent community sighting on this route's
   *  matching BusRoute (matched by `route.routeNumber === BusRoute.code`).
   *  Undefined when no sighting exists (or the route is not in the archive). */
  lastSightingAt?: string;
};

function RouteCard({ route, lastSightingAt }: RouteCardProps) {
  const sightingLabel = formatLastSightingLabel(lastSightingAt);

  return (
    <View style={styles.routeCard}>
      <View style={styles.routeTopRow}>
        <View style={styles.routeIdentity}>
          <View style={styles.routeNumberPill}>
            <Text style={styles.routeNumber}>{route.routeNumber}</Text>
          </View>
          <View style={styles.routeTitleBlock}>
            <Text style={styles.routeName}>{route.routeName}</Text>
            <Text style={styles.routeMeta}>{route.departureTime}</Text>
          </View>
        </View>
        <StatusBadge status={route.status} />
      </View>

      <View style={styles.pathBlock}>
        <StopRow label="출발" name={route.departure} active />
        <View style={styles.pathLine} />
        <StopRow label="도착" name={route.arrival} />
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeMeta}>
          <Clock3 size={13} color={colors.mintDark} strokeWidth={2.4} />
          <Text style={styles.timeText}>{route.departureTime}</Text>
        </View>
        <View style={styles.timeMeta}>
          <Timer size={13} color={colors.grayIcon} strokeWidth={2.4} />
          <Text style={styles.durationText}>{route.duration}</Text>
        </View>
      </View>

      {sightingLabel ? (
        <View
          style={styles.sightingBadge}
          accessibilityLabel={`최근 목격: ${sightingLabel}`}
        >
          <Bus size={12} color={colors.blue} strokeWidth={2.4} />
          <Text style={styles.sightingBadgeText}>마지막 목격 {sightingLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

type StopRowProps = {
  label: string;
  name: string;
  active?: boolean;
};

function StopRow({ label, name, active = false }: StopRowProps) {
  return (
    <View style={styles.stopRow}>
      <View
        style={[
          styles.stopMarker,
          active ? styles.activeStopMarker : styles.arrivalStopMarker,
        ]}
      >
        <MapPin
          size={12}
          color={active ? colors.surface : colors.mintDark}
          fill={active ? colors.mintDark : "transparent"}
          strokeWidth={2.4}
        />
      </View>
      <Text style={[styles.stopLabel, active && styles.activeStopLabel]}>
        {label}
      </Text>
      <Text style={styles.stopName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

type StatusBadgeProps = {
  status: RouteStatus;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyle =
    status === "운행중"
      ? styles.statusLive
      : status === "곧 도착"
        ? styles.statusSoon
        : styles.statusWaiting;
  const textStyle =
    status === "운행중"
      ? styles.statusLiveText
      : status === "곧 도착"
        ? styles.statusSoonText
        : styles.statusWaitingText;

  return (
    <View style={[styles.statusBadge, statusStyle]}>
      <Text style={[styles.statusText, textStyle]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.sheet,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: typography.weight.bold,
  },
  recordSightingButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recordSightingButtonPressed: {
    opacity: 0.84,
  },
  recordSightingText: {
    color: colors.surface,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  searchBar: {
    height: 52,
    paddingHorizontal: 17,
    borderRadius: 26,
    backgroundColor: colors.sheet,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.regular,
  },
  filterRow: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sortRow: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 14,
    paddingBottom: spacing.navHeight + 24,
    gap: 16,
  },
  summaryCard: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIconFrame: {
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
  summaryBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryBadgeText: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  sectionMeta: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  cardList: {
    gap: 10,
  },
  routeCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    gap: 14,
  },
  routeTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  routeIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeNumberPill: {
    minWidth: 48,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.mintDark,
    alignItems: "center",
    justifyContent: "center",
  },
  routeNumber: {
    color: colors.surface,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  routeTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  routeName: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  routeMeta: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  statusBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  statusLive: {
    backgroundColor: colors.mintLight,
  },
  statusSoon: {
    backgroundColor: colors.yellowLight,
  },
  statusWaiting: {
    backgroundColor: colors.line,
  },
  statusLiveText: {
    color: colors.mintDark,
  },
  statusSoonText: {
    color: colors.yellowText,
  },
  statusWaitingText: {
    color: colors.grayIcon,
  },
  pathBlock: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.mintLight,
    gap: 8,
  },
  stopRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeStopMarker: {
    backgroundColor: colors.mintDark,
  },
  arrivalStopMarker: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  pathLine: {
    width: 1,
    height: 14,
    marginLeft: 11,
    backgroundColor: colors.mint,
  },
  stopLabel: {
    width: 34,
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  activeStopLabel: {
    color: colors.mintDark,
  },
  stopName: {
    flex: 1,
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  timeRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  timeMeta: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  durationText: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  sightingBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.blueSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sightingBadgeText: {
    color: colors.blue,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
});
