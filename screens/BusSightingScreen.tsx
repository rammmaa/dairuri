import { Bus, MapPin } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";

import { Header } from "../components/Header";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import {
  getBusRoutes,
  getBusStops,
  recordBusSighting,
} from "../services/api";
import { resolveNearestStop } from "../services/busArchiveCore";
import type { BusRoute, BusSighting, BusStop } from "../types/domain";

export type BusSightingScreenProps = {
  onBack?: () => void;
};

type LocationStatus = "loading" | "granted" | "denied" | "error";

const LOCATION_DISTANCE_INTERVAL_M = 10;
const CLOCK_TICK_MS = 1_000;

export function BusSightingScreen({ onBack }: BusSightingScreenProps) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("loading");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recentRecord, setRecentRecord] = useState<BusSighting | null>(null);
  const [now, setNow] = useState(() => new Date());

  // The location subscription is kept in a ref so the cleanup in the unmount
  // effect can remove it even if a re-render replaces the watcher reference.
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // 1) Load routes + stops once. Mock-mode shapes match live shapes via the
  //    services/api aggregator, so there is no branching needed here.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([getBusRoutes(), getBusStops()]).then(
      ([loadedRoutes, loadedStops]) => {
        if (cancelled) return;
        setRoutes(loadedRoutes);
        setStops(loadedStops);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Request foreground location permission and start watching the position.
  //    On denial we keep the screen visible but disable the record button.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== Location.PermissionStatus.GRANTED) {
          setLocationStatus("denied");
          return;
        }

        setLocationStatus("granted");
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
          },
          (event) => {
            setUserLocation({
              latitude: event.coords.latitude,
              longitude: event.coords.longitude,
            });
          },
        );
      } catch {
        if (!cancelled) {
          setLocationStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  // 3) Tick the live clock so the user can see they are still looking at the
  //    moment they will commit when pressing the bus button. A self-scheduling
  //    setTimeout is used here so the loop can be cancelled cleanly on
  //    unmount. The effect ticks every CLOCK_TICK_MS until unmount.
  useEffect(() => {
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (cancelled) return;
      setNow(new Date());
      timerId = setTimeout(tick, CLOCK_TICK_MS);
    };

    timerId = setTimeout(tick, CLOCK_TICK_MS);

    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }, []);

  // The nearest stop is recomputed whenever location or stops change. We use
  // the same haversine helper the server uses, so the on-screen current
  // location chip names the stop the server would also snap to.
  const nearestStop = useMemo<BusStop | null>(() => {
    if (!userLocation || stops.length === 0) {
      return null;
    }
    const snapped = resolveNearestStop(
      userLocation,
      stops.map((stop) => ({
        stopId: stop.id,
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    );
    if (!snapped) return null;
    return stops.find((stop) => stop.id === snapped.stopId) ?? null;
  }, [userLocation, stops]);

  const canRecord =
    locationStatus === "granted" &&
    Boolean(userLocation) &&
    Boolean(nearestStop) &&
    Boolean(selectedRouteId) &&
    !recording;

  const handleRecord = async () => {
    if (!canRecord || !userLocation || !selectedRouteId) {
      return;
    }
    setRecording(true);
    setRecordError(null);
    try {
      const sighting = await recordBusSighting({
        routeId: selectedRouteId,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      setRecentRecord(sighting);
    } catch (error) {
      setRecordError(
        error instanceof Error ? error.message : "기록에 실패했어요. 다시 시도해 주세요.",
      );
    } finally {
      setRecording(false);
    }
  };

  const helpText = resolveHelpText({
    locationStatus,
    userLocation,
    nearestStop,
    selectedRouteId,
    recordError,
  });

  const selectedRouteCode =
    routes.find((route) => route.id === selectedRouteId)?.code ?? null;

  return (
    <View style={styles.root}>
      <Header title="방금 버스 봤어요?" showBack onBack={onBack} border />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text accessibilityRole="header" style={styles.headline}>
          방금 버스 봤어요!
        </Text>

        <Text style={styles.clock} accessibilityLabel="현재 시각">
          {formatClock(now)}
        </Text>

        <View style={styles.locationChip}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            현위치: {nearestStop ? nearestStop.name : "확인 중…"}
          </Text>
        </View>

        <View style={styles.routePicker} accessibilityLabel="어떤 버스를 보셨나요?">
          <Text style={styles.routePickerLabel}>어떤 버스인가요?</Text>
          <View style={styles.routeRow}>
            {routes.length === 0 ? (
              <Text style={styles.routePlaceholder}>노선 불러오는 중…</Text>
            ) : (
              routes.map((route) => {
                const selected = route.id === selectedRouteId;
                return (
                  <Pressable
                    key={route.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${route.code} 노선`}
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedRouteId(route.id)}
                    style={({ pressed }) => [
                      styles.routeChip,
                      selected && styles.routeChipSelected,
                      pressed && styles.routeChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.routeChipText,
                        selected && styles.routeChipTextSelected,
                      ]}
                    >
                      {route.code}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="방금 버스 봤어요 기록하기"
          accessibilityState={{ disabled: !canRecord }}
          disabled={!canRecord}
          onPress={handleRecord}
          testID="bus-sighting-record-button"
          style={({ pressed }) => [
            styles.busButton,
            !canRecord && styles.busButtonDisabled,
            pressed && canRecord && styles.busButtonPressed,
          ]}
        >
          <Bus
            size={56}
            color={canRecord ? colors.blue : colors.gray400}
            strokeWidth={2.2}
          />
        </Pressable>

        <Text style={styles.helpText}>{helpText}</Text>

        {recentRecord ? (
          <View style={styles.recentRecord} testID="bus-sighting-recent">
            <Text style={styles.recentRecordTitle}>최근 기록</Text>
            <View style={styles.recentRecordRow}>
              <MapPin size={14} color={colors.mintDark} />
              <Text style={styles.recentRecordText}>
                {formatClock(new Date(recentRecord.createdAt))} ·{" "}
                {stopNameFor(stops, recentRecord.stopId)}
                {selectedRouteCode ? ` · ${selectedRouteCode}` : ""}
              </Text>
            </View>
            <Text style={styles.recentRecordHint}>
              기록자 ID: {recentRecord.reporterLabel}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function resolveHelpText({
  locationStatus,
  userLocation,
  nearestStop,
  selectedRouteId,
  recordError,
}: {
  locationStatus: LocationStatus;
  userLocation: { latitude: number; longitude: number } | null;
  nearestStop: BusStop | null;
  selectedRouteId: string | null;
  recordError: string | null;
}) {
  if (recordError) {
    return recordError;
  }
  if (locationStatus === "denied") {
    return "위치 권한이 없으면 정류장을 자동으로 인식할 수 없어요. 설정에서 허용해 주세요.";
  }
  if (locationStatus === "error") {
    return "위치를 가져오는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.";
  }
  if (locationStatus === "loading" || !userLocation) {
    return "위치를 가져오는 중이에요…";
  }
  if (!nearestStop) {
    return "지금 위치에서는 다로리 정류장을 찾을 수 없어요.";
  }
  if (!selectedRouteId) {
    return "보신 버스의 노선을 골라주세요.";
  }
  return "버튼을 누르면, 현재 시각과 위치가 즉시 저장됩니다.";
}

function formatClock(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function stopNameFor(stops: BusStop[], stopId: string) {
  return stops.find((stop) => stop.id === stopId)?.name ?? stopId;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 32,
    alignItems: "center",
  },
  headline: {
    marginTop: 28,
    color: colors.blue,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.semibold,
  },
  clock: {
    marginTop: 16,
    color: colors.black,
    fontFamily:
      Platform.select({
        ios: "Menlo",
        android: "monospace",
        default: typography.family.bold,
      }) ?? typography.family.bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: 1.5,
    fontWeight: typography.weight.bold,
  },
  locationChip: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  locationText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  routePicker: {
    width: "100%",
    marginTop: 28,
    alignItems: "center",
  },
  routePickerLabel: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  routeRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  routePlaceholder: {
    color: colors.gray400,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  routeChip: {
    minWidth: 64,
    paddingHorizontal: 14,
    height: spacing.chipHeight,
    borderRadius: spacing.chipHeight / 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  routeChipSelected: {
    borderColor: colors.mintDark,
    backgroundColor: colors.mintLight,
  },
  routeChipPressed: {
    opacity: 0.7,
  },
  routeChipText: {
    color: colors.grayIcon,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  routeChipTextSelected: {
    color: colors.mintDark,
  },
  busButton: {
    marginTop: 32,
    width: 180,
    height: 130,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  busButtonDisabled: {
    backgroundColor: colors.gray100,
    opacity: 0.7,
  },
  busButtonPressed: {
    backgroundColor: colors.blueSoft,
    transform: [{ scale: 0.98 }],
  },
  helpText: {
    marginTop: 18,
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  recentRecord: {
    marginTop: 28,
    width: "100%",
    padding: 14,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.gray50,
  },
  recentRecordTitle: {
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  recentRecordRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recentRecordText: {
    color: colors.slate,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  recentRecordHint: {
    marginTop: 4,
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
});
