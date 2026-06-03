import { Clock3, MapPin } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BottomNav } from "../components/BottomNav";
import { Header } from "../components/Header";
import { RouteChip } from "../components/RouteChip";
import { RouteSelectGrid } from "../components/RouteSelectGrid";
import { StopRailList } from "../components/StopRailList";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { WEEKDAYS, getBusArrivalTimes } from "../data/busArrivalTimes";
import { bottomNavItems, type BottomNavItem } from "../data/mapHome";
import { getBusRouteStops, getBusRoutes, getBusStops } from "../services/api";
import type { BusRoute, BusRouteStop, BusStop, Weekday } from "../types/domain";

export type BusArrivalTimesScreenProps = {
  onBack?: () => void;
  onSelectTab?: (item: BottomNavItem) => void;
};

/**
 * "버스 도착 시간 기록" screen from the 2026-05-26 Figma frames (79/81/82). The
 * route/stop selection reuses the same RouteSelectGrid + StopRailList as the
 * bus archive recorder; picking a stop reveals a weekday selector and the
 * placeholder arrival timetable for that route + stop + weekday.
 *
 * The timetable is static placeholder data from data/busArrivalTimes.ts, not a
 * live operator schedule. See the 2026-05-26 realign spec finalization note.
 */
export function BusArrivalTimesScreen({
  onBack,
  onSelectTab,
}: BusArrivalTimesScreenProps) {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);

  const [chosenRouteId, setChosenRouteId] = useState<string | null>(null);
  const [chosenStopId, setChosenStopId] = useState<string | null>(null);
  const [weekday, setWeekday] = useState<Weekday>("월");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBusRoutes(), getBusStops(), getBusRouteStops()])
      .then(([loadedRoutes, loadedStops, loadedRouteStops]) => {
        if (cancelled) return;
        setRoutes(loadedRoutes);
        setStops(loadedStops);
        setRouteStops(loadedRouteStops);
        // Default to H1 so the stop list is never empty, mirroring the
        // selection screen default.
        setChosenRouteId((current) => current ?? loadedRoutes[0]?.id ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("[BusArrivalTimesScreen] failed to load bus topology", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopsForChosenRoute = useMemo<BusStop[]>(() => {
    if (!chosenRouteId) return [];
    return routeStops
      .filter((link) => link.routeId === chosenRouteId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((link) => stops.find((stop) => stop.id === link.stopId))
      .filter((stop): stop is BusStop => Boolean(stop));
  }, [chosenRouteId, routeStops, stops]);

  const chosenRoute = useMemo<BusRoute | null>(
    () => routes.find((route) => route.id === chosenRouteId) ?? null,
    [routes, chosenRouteId],
  );
  const chosenStop = useMemo<BusStop | null>(
    () => stops.find((stop) => stop.id === chosenStopId) ?? null,
    [stops, chosenStopId],
  );

  const arrivalTimes = useMemo<string[]>(() => {
    if (!chosenRouteId || !chosenStopId) return [];
    return getBusArrivalTimes(chosenRouteId, chosenStopId, weekday);
  }, [chosenRouteId, chosenStopId, weekday]);

  const inDetail = Boolean(chosenStop);

  const handleBack = () => {
    if (inDetail) {
      setChosenStopId(null);
      return;
    }
    onBack?.();
  };

  return (
    <View style={styles.root}>
      <Header title="버스 도착 시간 기록" showBack onBack={handleBack} border />

      {inDetail && chosenRoute && chosenStop ? (
        <ScrollView
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          <RouteChip label={chosenRoute.name} />
          <View style={styles.stopNameRow}>
            <MapPin size={20} color={colors.mintDark} strokeWidth={2.4} />
            <Text style={styles.stopNameText}>{chosenStop.name}</Text>
          </View>

          <Text style={styles.sectionLabel}>요일 선택</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => {
              const selected = day === weekday;
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`${day}요일`}
                  accessibilityState={{ selected }}
                  onPress={() => setWeekday(day)}
                  testID={`arrival-weekday-${day}`}
                  style={({ pressed }) => [
                    styles.weekdayChip,
                    selected && styles.weekdayChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      selected && styles.weekdayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>버스 시간</Text>
          <View style={styles.timeList}>
            {arrivalTimes.map((time, index) => (
              <View
                key={`${time}-${index}`}
                style={styles.timeRow}
                testID={`arrival-time-${index}`}
              >
                <Clock3 size={15} color={colors.mintDark} strokeWidth={2.2} />
                <Text style={styles.timeText}>{time}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.selectionRoot}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectSectionLabel}>행복버스 노선 선택 (1번 - 6번)</Text>
            <RouteSelectGrid
              routes={routes}
              selectedRouteId={chosenRouteId}
              onSelect={(routeId) => {
                setChosenRouteId(routeId);
                setChosenStopId(null);
              }}
              testIDPrefix="arrival-route-chip"
            />
            <Text style={[styles.selectSectionLabel, styles.selectSectionLabelSpaced]}>
              행복버스 정류장 선택
            </Text>
          </View>
          <ScrollView
            style={styles.stopScroll}
            contentContainerStyle={styles.stopScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <StopRailList
              stops={stopsForChosenRoute}
              selectedStopId={chosenStopId}
              onSelect={setChosenStopId}
              testIDPrefix="arrival-stop-row"
            />
          </ScrollView>
        </View>
      )}

      <BottomNav
        items={bottomNavItems}
        selectedId="bus"
        onSelect={onSelectTab}
        testID="arrival-bottom-nav"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // selection
  selectionRoot: {
    flex: 1,
    width: "100%",
  },
  selectionHeader: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  selectSectionLabel: {
    color: colors.grayText,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: 10,
  },
  selectSectionLabelSpaced: {
    marginTop: 18,
    marginBottom: 0,
  },
  stopScroll: {
    flex: 1,
  },
  stopScrollContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: spacing.navHeight + 24,
  },

  // detail
  detailContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 20,
    paddingBottom: spacing.navHeight + 24,
    alignItems: "center",
  },
  stopNameRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopNameText: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  sectionLabel: {
    alignSelf: "flex-start",
    marginTop: 24,
    marginBottom: 12,
    color: colors.grayText,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  weekdayRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  weekdayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayChipSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  weekdayText: {
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  weekdayTextSelected: {
    color: colors.surface,
    fontFamily: typography.family.bold,
    fontWeight: typography.weight.bold,
  },
  timeList: {
    width: "100%",
  },
  timeRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  timeText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  pressed: {
    opacity: 0.8,
  },
});
