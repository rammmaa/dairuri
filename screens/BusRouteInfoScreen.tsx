import { Bus, MapPin } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "../components/Header";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { getBusRoutes, getBusRouteStops, getBusStops } from "../services/api";
import type { BusRoute, BusRouteStop, BusStop } from "../types/domain";

export type BusRouteInfoScreenProps = {
  onBack?: () => void;
};

export function BusRouteInfoScreen({ onBack }: BusRouteInfoScreenProps) {
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
            error instanceof Error ? error.message : "노선 정보를 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stopById = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops]);
  const linksByRouteId = useMemo(() => {
    const map = new Map<string, BusRouteStop[]>();
    for (const link of routeStops) {
      const current = map.get(link.routeId) ?? [];
      current.push(link);
      map.set(link.routeId, current);
    }
    for (const links of map.values()) {
      links.sort((a, b) => a.sequence - b.sequence);
    }
    return map;
  }, [routeStops]);

  return (
    <View style={styles.root}>
      <Header title="노선 정보" showBack onBack={onBack} border />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Bus size={22} color={colors.mintDark} strokeWidth={2.4} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>행복버스 노선</Text>
            <Text style={styles.summaryTitle}>총 {routes.length}개 노선</Text>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.routeList}>
          {routes.map((route) => (
            <RouteInfoCard
              key={route.id}
              route={route}
              links={linksByRouteId.get(route.id) ?? []}
              stopById={stopById}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function RouteInfoCard({
  route,
  links,
  stopById,
}: {
  route: BusRoute;
  links: BusRouteStop[];
  stopById: Map<string, BusStop>;
}) {
  const stopNames = links
    .map((link) => stopById.get(link.stopId)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <View style={styles.card}>
      <View style={styles.routeHeader}>
        <View style={styles.routeCode}>
          <Text style={styles.routeCodeText}>{route.code}</Text>
        </View>
        <View style={styles.routeTitleBlock}>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.routeMeta}>{stopNames.length}개 정류장</Text>
        </View>
      </View>

      <View style={styles.stopList}>
        {stopNames.map((name, index) => (
          <View key={`${route.id}-${name}-${index}`} style={styles.stopRow}>
            <View style={styles.stopIndex}>
              <Text style={styles.stopIndexText}>{index + 1}</Text>
            </View>
            <MapPin size={13} color={colors.mintDark} strokeWidth={2.3} />
            <Text style={styles.stopName} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
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
  routeList: {
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    gap: 12,
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeCode: {
    minWidth: 46,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
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
  routeTitleBlock: {
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
  routeMeta: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  stopList: {
    gap: 8,
  },
  stopRow: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stopIndexText: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  stopName: {
    flex: 1,
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
});
