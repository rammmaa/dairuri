import { AlertTriangle, Bus, Info, MapPin } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as Location from "expo-location";

import { BottomNav } from "../components/BottomNav";
import { BusArrivalTimesEntry } from "../components/BusArrivalTimesEntry";
import { BusRouteMap } from "../components/BusRouteMap";
import { ConfirmRecordModal } from "../components/ConfirmRecordModal";
import { ConfirmedModal } from "../components/ConfirmedModal";
import { Header } from "../components/Header";
import { RouteChip } from "../components/RouteChip";
import { RouteSelectGrid } from "../components/RouteSelectGrid";
import { StopRailList } from "../components/StopRailList";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { bottomNavItems, type BottomNavItem } from "../data/mapHome";
import {
  getBusRouteStops,
  getBusRoutes,
  getBusStops,
  recordBusSighting,
} from "../services/api";
import {
  inferRouteAndStop,
  type InferenceResult,
} from "../services/busArchiveCore";
import type { BusRoute, BusRouteStop, BusStop } from "../types/domain";

export type BusSightingScreenProps = {
  onBack?: () => void;
  /** Optional callback for the header (i) icon. When provided, the icon
   *  renders and tapping it opens the per-route info screen. Phase 2 wires
   *  this to a Coming Soon stub. */
  onOpenRouteInfo?: () => void;
  /** Optional callback for the prominent "버스 도착 시간 기록 보기" card on the
   *  recorder. Opens the arrival-times screen. */
  onOpenArrivalTimes?: () => void;
  /** Optional callback for the [기록 보기] button on the confirmed modal. Opens
   *  the archive-history screen. */
  onOpenArchiveHistory?: () => void;
  /** Optional bottom-tab routing. The host (App.tsx) exits this screen and
   *  switches the active tab, the same wiring RouteScreen uses. */
  onSelectTab?: (item: BottomNavItem) => void;
};

type LocationStatus = "loading" | "granted" | "denied" | "error";

// The flow follows the 2026-05-26 Figma frames. The route-grid and
// stop-selection frames are merged into a single "selection" body (a sticky
// route chip grid over a scrollable stop rail). The old inline "confirmed"
// body is replaced by the ConfirmedModal overlay, tracked by `recordCompleted`
// rather than its own flow state.
type FlowState = "recorder" | "confirmation" | "selection";

const LOCATION_DISTANCE_INTERVAL_M = 10;
const CONFIRMATION_MAP_HEIGHT = 190;
const PHONE_MAX_WIDTH = 430;
const CARD_HORIZONTAL_PADDING = 14;

const HEADER_TITLES: Record<FlowState, string> = {
  recorder: "버스 아카이빙",
  confirmation: "정류장 매칭 확인",
  selection: "노선/정류장 선택",
};

export function BusSightingScreen({
  onBack,
  onOpenRouteInfo,
  onOpenArrivalTimes,
  onOpenArchiveHistory,
  onSelectTab,
}: BusSightingScreenProps) {
  // The map preview stretches to fill the card content area. We cap the
  // working width at the iPhone Pro Max width so the diagram does not balloon
  // on desktop web builds; everything beyond that becomes surrounding
  // whitespace instead of stretched UI.
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth, PHONE_MAX_WIDTH) - spacing.screenX * 2;
  const mapWidth = Math.max(contentWidth - CARD_HORIZONTAL_PADDING * 2, 220);

  const [flowState, setFlowState] = useState<FlowState>("recorder");
  const [recordCompleted, setRecordCompleted] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("loading");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);

  // Frozen at the moment the user pressed the recorder bus button so the
  // confirmation panel does not jitter while the user is still deciding.
  const [inferredResult, setInferredResult] = useState<
    InferenceResult<BusRoute, BusStop> | null
  >(null);

  // The coordinate captured at bus-button press time. We commit *this* rather
  // than the latest `userLocation` so the server snap matches the stop the
  // user confirmed on screen.
  const [committedLocation, setCommittedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [chosenRouteId, setChosenRouteId] = useState<string | null>(null);
  const [chosenStopId, setChosenStopId] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // 1) Load the bus topology once.
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
        console.warn("[BusSightingScreen] failed to load bus topology", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Request foreground location permission and watch the position. The
  //    cleanup guards both the "subscription resolves after unmount" race and
  //    "remove throws on the web fallback" by catching silently.
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
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
          },
          (event) => {
            if (cancelled) return;
            setUserLocation({
              latitude: event.coords.latitude,
              longitude: event.coords.longitude,
            });
          },
        );

        if (cancelled) {
          try {
            sub.remove();
          } catch {
            // ignore: web fallback may have already torn down the watchId
          }
          return;
        }

        subscriptionRef.current = sub;
      } catch {
        if (!cancelled) {
          setLocationStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      const current = subscriptionRef.current;
      subscriptionRef.current = null;
      try {
        current?.remove();
      } catch {
        // ignore: see comment above
      }
    };
  }, []);

  // The inference is the same routine the server uses, so the on-screen
  // current-location chip names the stop the server would snap to.
  const liveInference = useMemo<InferenceResult<BusRoute, BusStop> | null>(() => {
    if (
      !userLocation ||
      routes.length === 0 ||
      stops.length === 0 ||
      routeStops.length === 0
    ) {
      return null;
    }
    return inferRouteAndStop(userLocation, routes, routeStops, stops);
  }, [userLocation, routes, stops, routeStops]);

  const canStartConfirmation =
    flowState === "recorder" &&
    locationStatus === "granted" &&
    Boolean(userLocation) &&
    Boolean(liveInference) &&
    !recording;

  // The chosen route's stop catalog for the selection screen, in sequence.
  const stopsForChosenRoute = useMemo<BusStop[]>(() => {
    if (!chosenRouteId) return [];
    const ordered = routeStops
      .filter((link) => link.routeId === chosenRouteId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((link) => stops.find((stop) => stop.id === link.stopId))
      .filter((stop): stop is BusStop => Boolean(stop));
    return ordered;
  }, [chosenRouteId, routeStops, stops]);

  const chosenRoute = useMemo<BusRoute | null>(
    () => routes.find((route) => route.id === chosenRouteId) ?? null,
    [routes, chosenRouteId],
  );
  const chosenStop = useMemo<BusStop | null>(
    () => stops.find((stop) => stop.id === chosenStopId) ?? null,
    [stops, chosenStopId],
  );

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------

  const handleBusButton = () => {
    if (!canStartConfirmation || !liveInference || !userLocation) {
      return;
    }
    setInferredResult(liveInference);
    setCommittedLocation({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });
    setRecordError(null);
    setFlowState("confirmation");
  };

  const commitSighting = async (routeId: string, stopId?: string) => {
    // Prefer the location captured at bus-button press; fall back to the live
    // location only when no commit point exists yet.
    const location = committedLocation ?? userLocation;
    if (!location) return;
    setRecording(true);
    setRecordError(null);
    try {
      await recordBusSighting({
        routeId,
        stopId,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setConfirmModalOpen(false);
      setRecordCompleted(true);
    } catch (error) {
      setRecordError(
        error instanceof Error
          ? error.message
          : "기록에 실패했어요. 다시 시도해 주세요.",
      );
    } finally {
      setRecording(false);
    }
  };

  const handleConfirmAccept = () => {
    if (!inferredResult) return;
    void commitSighting(inferredResult.route.id);
  };

  const handleConfirmReject = () => {
    setRecordError(null);
    // Default the route to H1 so the stop list is never empty (the user asked
    // for route 1 to be preselected on entry). Pick it by code so a live API
    // that returns routes out of order still defaults correctly; fall back to
    // the first route only if H1 is missing.
    const defaultRouteId =
      routes.find((route) => route.code === "H1")?.id ?? routes[0]?.id ?? null;
    setChosenRouteId((current) => current ?? defaultRouteId);
    setChosenStopId(null);
    setFlowState("selection");
  };

  const handlePickRoute = (routeId: string) => {
    setChosenRouteId(routeId);
    setChosenStopId(null);
  };

  const handlePickStop = (stopId: string) => {
    setChosenStopId(stopId);
    setRecordError(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmRecord = () => {
    if (!chosenRouteId || !chosenStopId) return;
    void commitSighting(chosenRouteId, chosenStopId);
  };

  // The back affordance walks the state machine in reverse, except in the
  // recorder state where it pops the screen.
  const handleStateBack = () => {
    switch (flowState) {
      case "confirmation":
        setFlowState("recorder");
        setInferredResult(null);
        setCommittedLocation(null);
        return;
      case "selection":
        setFlowState("confirmation");
        setConfirmModalOpen(false);
        setChosenStopId(null);
        return;
      case "recorder":
      default:
        onBack?.();
        return;
    }
  };

  const headerTitle = HEADER_TITLES[flowState];

  return (
    <View style={styles.root}>
      <Header
        title={headerTitle}
        showBack
        onBack={handleStateBack}
        border
        right={
          onOpenRouteInfo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="노선 정보"
              hitSlop={12}
              onPress={onOpenRouteInfo}
              testID="bus-sighting-info-button"
              style={({ pressed }) => [
                styles.infoButton,
                pressed && styles.infoButtonPressed,
              ]}
            >
              <Info size={20} color={colors.grayIcon} strokeWidth={2.2} />
            </Pressable>
          ) : undefined
        }
      />

      {flowState === "selection" ? (
        <RouteAndStopSelectView
          routes={routes}
          chosenRouteId={chosenRouteId}
          chosenStopId={chosenStopId}
          stopsForRoute={stopsForChosenRoute}
          recordError={recordError}
          onPickRoute={handlePickRoute}
          onPickStop={handlePickStop}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {flowState === "recorder" ? (
            <RecorderView
              locationStatus={locationStatus}
              userLocation={userLocation}
              liveInference={liveInference}
              canStartConfirmation={canStartConfirmation}
              onPressBusButton={handleBusButton}
              onOpenArrivalTimes={onOpenArrivalTimes}
            />
          ) : null}

          {flowState === "confirmation" && inferredResult ? (
            <ConfirmationView
              inference={inferredResult}
              stops={stops}
              routeStops={routeStops}
              mapWidth={mapWidth}
              recording={recording}
              recordError={recordError}
              onAccept={handleConfirmAccept}
              onReject={handleConfirmReject}
            />
          ) : null}
        </ScrollView>
      )}

      <BottomNav
        items={bottomNavItems}
        selectedId="bus"
        onSelect={onSelectTab}
        testID="bus-sighting-bottom-nav"
      />

      {flowState === "selection" && confirmModalOpen && chosenRoute && chosenStop ? (
        <ConfirmRecordModal
          routeName={chosenRoute.name}
          stopName={chosenStop.name}
          recording={recording}
          onCancel={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirmRecord}
          testID="bus-sighting-confirm-record-modal"
        />
      ) : null}

      {recordCompleted ? (
        <ConfirmedModal
          onHome={() => onBack?.()}
          onViewRecord={() => onOpenArchiveHistory?.()}
          testID="bus-sighting-confirmed-modal"
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Recorder view
// ---------------------------------------------------------------------------

function RecorderView({
  locationStatus,
  userLocation,
  liveInference,
  canStartConfirmation,
  onPressBusButton,
  onOpenArrivalTimes,
}: {
  locationStatus: LocationStatus;
  userLocation: { latitude: number; longitude: number } | null;
  liveInference: InferenceResult<BusRoute, BusStop> | null;
  canStartConfirmation: boolean;
  onPressBusButton: () => void;
  onOpenArrivalTimes?: () => void;
}) {
  const helpText = resolveRecorderHelpText({
    locationStatus,
    userLocation,
    liveInference,
  });

  return (
    <View style={styles.stateBlock}>
      {onOpenArrivalTimes ? (
        <BusArrivalTimesEntry
          onPress={onOpenArrivalTimes}
          testID="bus-sighting-arrival-times-entry"
        />
      ) : null}

      <View style={styles.recorderCard}>
        <Text accessibilityRole="header" style={styles.headline}>
          방금 버스 봤어요!
        </Text>

        <View style={styles.busButtonHalo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="방금 버스 봤어요 기록 시작"
            accessibilityState={{ disabled: !canStartConfirmation }}
            disabled={!canStartConfirmation}
            onPress={onPressBusButton}
            testID="bus-sighting-record-button"
            style={({ pressed }) => [
              styles.busButton,
              !canStartConfirmation && styles.busButtonDisabled,
              pressed && canStartConfirmation && styles.busButtonPressed,
            ]}
          >
            <Bus size={56} color={colors.surface} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.locationChip}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            현위치: {liveInference ? liveInference.stop.name : "확인 중"}
          </Text>
        </View>

        <Text style={styles.helpText}>{helpText}</Text>
      </View>
    </View>
  );
}

function resolveRecorderHelpText({
  locationStatus,
  userLocation,
  liveInference,
}: {
  locationStatus: LocationStatus;
  userLocation: { latitude: number; longitude: number } | null;
  liveInference: InferenceResult<BusRoute, BusStop> | null;
}) {
  if (locationStatus === "denied") {
    return "위치 권한이 없으면 정류장을 자동으로 인식할 수 없어요. 설정에서 허용해 주세요.";
  }
  if (locationStatus === "error") {
    return "위치를 가져오는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.";
  }
  if (locationStatus === "loading" || !userLocation) {
    return "위치를 가져오는 중이에요";
  }
  if (!liveInference) {
    return "지금 위치 근처에서 노선을 찾을 수 없어요.";
  }
  return "버튼을 누르면, 현재 시각과 위치가 즉시 저장됩니다.";
}

// ---------------------------------------------------------------------------
// Confirmation view
// ---------------------------------------------------------------------------

function ConfirmationView({
  inference,
  stops,
  routeStops,
  mapWidth,
  recording,
  recordError,
  onAccept,
  onReject,
}: {
  inference: InferenceResult<BusRoute, BusStop>;
  stops: BusStop[];
  routeStops: BusRouteStop[];
  mapWidth: number;
  recording: boolean;
  recordError: string | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.stateBlock}>
      <Text accessibilityRole="header" style={styles.confirmHeadline}>
        이 정류장이 맞나요?
      </Text>
      <Text style={styles.confirmHint}>기록확정을 위해 버튼을 눌러주세요</Text>

      <View style={styles.confirmCard}>
        <RouteChip label={inference.route.name} />
        <View style={styles.stopNameRow}>
          <MapPin size={20} color={colors.mintDark} strokeWidth={2.4} />
          <Text style={styles.stopNameText}>{inference.stop.name}</Text>
        </View>

        <View style={styles.mapTile}>
          <BusRouteMap
            routeId={inference.route.id}
            stops={stops}
            routeStops={routeStops}
            width={mapWidth}
            height={CONFIRMATION_MAP_HEIGHT}
            highlightedStopId={inference.stop.id}
          />
        </View>
      </View>

      {recordError ? <Text style={styles.errorText}>{recordError}</Text> : null}

      <View style={styles.confirmButtonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="틀려요"
          onPress={onReject}
          disabled={recording}
          testID="bus-sighting-reject-button"
          style={({ pressed }) => [
            styles.pillButton,
            styles.rejectButton,
            pressed && styles.pressed,
            recording && styles.buttonDisabled,
          ]}
        >
          <AlertTriangle size={18} color={colors.surface} strokeWidth={2.4} />
          <Text style={styles.pillButtonText}>틀려요</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="맞아요"
          onPress={onAccept}
          disabled={recording}
          testID="bus-sighting-accept-button"
          style={({ pressed }) => [
            styles.pillButton,
            styles.acceptButton,
            pressed && styles.pressed,
            recording && styles.buttonDisabled,
          ]}
        >
          <Bus size={18} color={colors.surface} strokeWidth={2.4} />
          <Text style={styles.pillButtonText}>
            {recording ? "기록 중" : "맞아요"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Merged route + stop selection view
// ---------------------------------------------------------------------------

function RouteAndStopSelectView({
  routes,
  chosenRouteId,
  chosenStopId,
  stopsForRoute,
  recordError,
  onPickRoute,
  onPickStop,
}: {
  routes: BusRoute[];
  chosenRouteId: string | null;
  chosenStopId: string | null;
  stopsForRoute: BusStop[];
  recordError: string | null;
  onPickRoute: (routeId: string) => void;
  onPickStop: (stopId: string) => void;
}) {
  return (
    <View style={styles.selectionRoot}>
      <View style={styles.selectionHeader}>
        <Text style={styles.sectionLabel}>행복버스 노선 선택 (1번 - 6번)</Text>
        <RouteSelectGrid
          routes={routes}
          selectedRouteId={chosenRouteId}
          onSelect={onPickRoute}
          testIDPrefix="bus-sighting-route-chip"
        />
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          행복버스 정류장 선택
        </Text>
      </View>

      {/* A failed "기록 확정" leaves the confirm modal open and sets this; once
          the user dismisses the modal the error stays visible here, above the
          scrolling stop list. */}
      {recordError ? (
        <Text style={[styles.errorText, styles.selectionError]}>
          {recordError}
        </Text>
      ) : null}

      <ScrollView
        style={styles.stopScroll}
        contentContainerStyle={styles.stopScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StopRailList
          stops={stopsForRoute}
          selectedStopId={chosenStopId}
          onSelect={onPickStop}
          testIDPrefix="bus-sighting-stop-row"
        />
      </ScrollView>
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
    paddingBottom: spacing.navHeight + 24,
    alignItems: "center",
  },
  stateBlock: {
    width: "100%",
    alignItems: "center",
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  infoButtonPressed: {
    opacity: 0.7,
  },

  // recorder
  recorderCard: {
    marginTop: 16,
    width: "100%",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 18,
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
  headline: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
  },
  busButtonHalo: {
    marginTop: 28,
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  busButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  busButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  busButtonPressed: {
    backgroundColor: colors.mintDark,
    transform: [{ scale: 0.97 }],
  },
  locationChip: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  helpText: {
    marginTop: 16,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
    paddingHorizontal: 12,
  },

  // confirmation
  confirmHeadline: {
    marginTop: 18,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
  confirmHint: {
    marginTop: 6,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  confirmCard: {
    marginTop: 18,
    width: "100%",
    paddingVertical: 20,
    paddingHorizontal: CARD_HORIZONTAL_PADDING,
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
  },
  mapTile: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    color: colors.red,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    textAlign: "center",
  },
  confirmButtonRow: {
    marginTop: 22,
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  pillButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rejectButton: {
    backgroundColor: colors.red,
  },
  acceptButton: {
    backgroundColor: colors.mintDark,
  },
  pillButtonText: {
    color: colors.surface,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  pressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.55,
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
  sectionLabel: {
    color: colors.grayText,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 18,
    marginBottom: 0,
  },
  selectionError: {
    paddingHorizontal: spacing.screenX,
    textAlign: "left",
  },
  stopScroll: {
    flex: 1,
  },
  stopScrollContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: spacing.navHeight + 24,
  },
});
