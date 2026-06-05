import { Bus } from "lucide-react-native";
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
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import {
  busOperatorContacts,
  busSchedule,
  type BusScheduleEntry,
} from "../data/busSchedule";
import { getBusRouteStops, getBusRoutes, getBusStops } from "../services/api";
import type { BusRoute, BusRouteStop, BusStop } from "../types/domain";

export type BusRouteInfoScreenProps = {
  onBack?: () => void;
};

const MAP_HEIGHT = 220;

/**
 * "청도 행복버스" route-info screen reached from the (i) icon in the bus archive
 * header (2026-06-06 frames). Shows the whole Happy Bus network on a real map,
 * then scrolls through every route's timetable - the circular route (순환선) and
 * the round-trip routes (일방향선) - with each route's stop list, and the
 * operator contact numbers at the bottom. Replaces the ComingSoon stub.
 */
export function BusRouteInfoScreen({ onBack }: BusRouteInfoScreenProps) {
  const { width } = useWindowDimensions();
  const mapWidth = Math.max(Math.min(width, 430) - spacing.screenX * 2, 220);

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);

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
        console.warn("[BusRouteInfoScreen] failed to load bus topology", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopsByRoute = useMemo(() => {
    const map = new Map<string, string>();
    for (const route of routes) {
      const names = routeStops
        .filter((link) => link.routeId === route.id)
        .sort((a, b) => a.sequence - b.sequence)
        .map((link) => stops.find((stop) => stop.id === link.stopId)?.name)
        .filter((name): name is string => Boolean(name));
      map.set(route.id, names.join(" - "));
    }
    return map;
  }, [routes, routeStops, stops]);

  const firstRouteId = routes[0]?.id ?? null;
  const otherRouteIds = routes.slice(1).map((route) => route.id);
  const circular = routes.filter(
    (route) => busSchedule[route.id]?.category === "순환선",
  );
  const oneWay = routes.filter(
    (route) => busSchedule[route.id]?.category === "일방향선",
  );

  return (
    <View style={styles.root}>
      <Header title="청도 행복버스" showBack onBack={onBack} border />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.bigTitle}>청도</Text>
            <Text style={styles.subTitle}>행복버스</Text>
          </View>
          <Bus size={34} color={colors.yellowText} strokeWidth={2.2} />
        </View>

        {firstRouteId ? (
          <View style={styles.mapWrap}>
            <BusRouteMap
              routeId={firstRouteId}
              stops={stops}
              routeStops={routeStops}
              width={mapWidth}
              height={MAP_HEIGHT}
              markEndpoints
              backgroundRouteIds={otherRouteIds}
            />
            <View style={styles.legendRow}>
              <Legend color={colors.mintDark} label="기점" />
              <Legend color={colors.red} label="종점" double />
              <Legend color={colors.gray400} label="다른 노선" />
            </View>
          </View>
        ) : null}

        {circular.length > 0 ? (
          <SectionHeader title="순환선" note="1일 3회 순환 운행" />
        ) : null}
        {circular.map((route) => (
          <RouteScheduleBlock
            key={route.id}
            route={route}
            schedule={busSchedule[route.id]}
            stopsText={stopsByRoute.get(route.id) ?? ""}
          />
        ))}

        {oneWay.length > 0 ? (
          <SectionHeader title="일방향선" note="1일 3회 왕복 운행" />
        ) : null}
        {oneWay.map((route) => (
          <RouteScheduleBlock
            key={route.id}
            route={route}
            schedule={busSchedule[route.id]}
            stopsText={stopsByRoute.get(route.id) ?? ""}
          />
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>버스운행 관련 문의 전화</Text>
          {busOperatorContacts.map((line) => (
            <Text key={line} style={styles.contactLine}>
              {"•"} {line}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, note }: { title: string; note: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionNote}>{note}</Text>
    </View>
  );
}

function RouteScheduleBlock({
  route,
  schedule,
  stopsText,
}: {
  route: BusRoute;
  schedule?: BusScheduleEntry;
  stopsText: string;
}) {
  if (!schedule) return null;
  return (
    <View style={styles.routeBlock}>
      <View style={styles.routeBlockHeader}>
        <RouteChip label={route.name} />
        <Text style={styles.segment}>{schedule.segment}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tr, styles.theadRow]}>
          <Text style={[styles.cell, styles.labelCell, styles.th]}>구분</Text>
          <Text style={[styles.cell, styles.stopCell, styles.th]} numberOfLines={1}>
            {schedule.durationNote}
          </Text>
          <Text style={[styles.cell, styles.timeCell, styles.th]}>1회</Text>
          <Text style={[styles.cell, styles.timeCell, styles.th]}>2회</Text>
          <Text style={[styles.cell, styles.timeCell, styles.th]}>3회</Text>
        </View>
        {schedule.rows.map((row, index) => (
          <View key={`${row.label}-${index}`} style={styles.tr}>
            <Text style={[styles.cell, styles.labelCell]}>{row.label}</Text>
            <Text style={[styles.cell, styles.stopCell]} numberOfLines={1}>
              {row.stop}
            </Text>
            {row.times.map((time, i) => (
              <Text key={i} style={[styles.cell, styles.timeCell]}>
                {time}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.routeLineRow}>
        <Text style={styles.routeLineLabel}>노선</Text>
        <Text style={styles.routeLineText}>{stopsText}</Text>
      </View>
    </View>
  );
}

function Legend({
  color,
  label,
  double,
}: {
  color: string;
  label: string;
  double?: boolean;
}) {
  return (
    <View style={styles.legend}>
      <View
        style={[
          styles.legendDot,
          { backgroundColor: double ? colors.surface : color },
          double && { borderWidth: 2.5, borderColor: color },
        ]}
      />
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
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bigTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
  },
  subTitle: {
    color: colors.grayText,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  mapWrap: {
    marginTop: 14,
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
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  legendText: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  sectionHeader: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  sectionNote: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  routeBlock: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  routeBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    color: colors.slate,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 8,
    overflow: "hidden",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  theadRow: {
    backgroundColor: colors.gray50,
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: "center",
  },
  th: {
    color: colors.grayText,
    fontFamily: typography.family.semibold,
  },
  labelCell: {
    width: 36,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  stopCell: {
    flex: 1,
    textAlign: "left",
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  timeCell: {
    width: 46,
  },
  routeLineRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  routeLineLabel: {
    width: 30,
    color: colors.grayText,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.sm,
  },
  routeLineText: {
    flex: 1,
    color: colors.slate,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.sm,
  },
  contactCard: {
    marginTop: 26,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.gray50,
  },
  contactTitle: {
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: 6,
  },
  contactLine: {
    color: colors.slate,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.base,
  },
});
