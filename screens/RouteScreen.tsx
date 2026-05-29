import {
  Bus,
  ChevronRight,
  Clock3,
  History,
  MapPin,
  Search,
  Timer,
} from "lucide-react-native";
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
  onOpenArchiveHistory?: () => void;
  onOpenArrivalTimes?: () => void;
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

// Prototype-only data: six Happy Bus rows match the H1 through H6 routes in
// data/mockDomain so the per-route last-sighting badge can resolve by code.
// The schedule values (departure time, duration, status, isExpress) are
// placeholders until a real operator schedule is wired in.
const routeCards: RouteCardData[] = [
  {
    id: "happy-1",
    routeName: "행복버스 1호선",
    routeNumber: "H1",
    departure: "청도 코아루블루핀",
    arrival: "청도 버스 터미널",
    departureTime: "06:10 출발",
    departureMinutes: 370,
    duration: "12분",
    durationMinutes: 12,
    status: "운행중",
  },
  {
    id: "happy-2",
    routeName: "행복버스 2호선",
    routeNumber: "H2",
    departure: "청도군청",
    arrival: "성조 아파트 앞",
    departureTime: "06:30 출발",
    departureMinutes: 390,
    duration: "14분",
    durationMinutes: 14,
    status: "곧 도착",
    isExpress: true,
  },
  {
    id: "happy-3",
    routeName: "행복버스 3호선",
    routeNumber: "H3",
    departure: "청도 버스 터미널",
    arrival: "부민 아파트",
    departureTime: "07:00 출발",
    departureMinutes: 420,
    duration: "18분",
    durationMinutes: 18,
    status: "운행중",
  },
  {
    id: "happy-4",
    routeName: "행복버스 4호선",
    routeNumber: "H4",
    departure: "성조 아파트 앞",
    arrival: "어린이집",
    departureTime: "07:20 출발",
    departureMinutes: 440,
    duration: "10분",
    durationMinutes: 10,
    status: "배차대기",
  },
  {
    id: "happy-5",
    routeName: "행복버스 5호선",
    routeNumber: "H5",
    departure: "부민 아파트",
    arrival: "청도 코아루블루핀",
    departureTime: "07:40 출발",
    departureMinutes: 460,
    duration: "22분",
    durationMinutes: 22,
    status: "곧 도착",
  },
  {
    id: "happy-6",
    routeName: "행복버스 6호선",
    routeNumber: "H6",
    departure: "어린이집",
    arrival: "청도 버스 터미널",
    departureTime: "08:00 출발",
    departureMinutes: 480,
    duration: "25분",
    durationMinutes: 25,
    status: "운행중",
  },
];

export function RouteScreen({
  onSelectTab,
  onOpenBusSighting,
  onOpenArchiveHistory,
  onOpenArrivalTimes,
}: RouteScreenProps) {
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
    getBusRoutes()
      .then((routes) => {
        if (!cancelled) {
          setBusRoutes(routes);
        }
      })
      .catch((error) => {
        // The badge is non-critical; if the bus archive endpoint fails we
        // simply render the route cards without the freshness badge. Avoid
        // surfacing the error to the user since the rest of the screen is
        // unaffected.
        if (cancelled) return;
        console.warn("[RouteScreen] failed to load bus routes", error);
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

          {onOpenArrivalTimes || onOpenArchiveHistory ? (
            <View style={styles.entryGroup}>
              {onOpenArrivalTimes ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="버스 도착 시간 기록 보기"
                  onPress={onOpenArrivalTimes}
                  testID="route-open-arrival-times"
                  style={({ pressed }) => [
                    styles.entryRow,
                    pressed && styles.entryRowPressed,
                  ]}
                >
                  <Clock3 size={18} color={colors.mintDark} strokeWidth={2.2} />
                  <Text style={styles.entryRowLabel}>버스 도착 시간 기록 보기</Text>
                  <ChevronRight size={18} color={colors.gray400} />
                </Pressable>
              ) : null}
              {onOpenArchiveHistory ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="아카이빙 보기"
                  onPress={onOpenArchiveHistory}
                  testID="route-open-archive-history"
                  style={({ pressed }) => [
                    styles.entryRow,
                    pressed && styles.entryRowPressed,
                  ]}
                >
                  <History size={18} color={colors.mintDark} strokeWidth={2.2} />
                  <Text style={styles.entryRowLabel}>아카이빙 보기</Text>
                  <ChevronRight size={18} color={colors.gray400} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

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
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxl,
    lineHeight: typography.lineHeight.xxl,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
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
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
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
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  summaryTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  entryGroup: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  entryRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
  },
  entryRowPressed: {
    backgroundColor: colors.mintLight,
  },
  entryRowLabel: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  sectionMeta: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  routeTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  routeName: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  routeMeta: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  statusBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  activeStopLabel: {
    color: colors.mintDark,
  },
  stopName: {
    flex: 1,
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  durationText: {
    color: colors.grayIcon,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
