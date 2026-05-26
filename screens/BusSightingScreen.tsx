import {
  AlertTriangle,
  Bus,
  Check,
  ChevronRight,
  Clock3,
  Info,
  MapPin,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as Location from "expo-location";

import { Header } from "../components/Header";
import { RouteMapPreview } from "../components/RouteMapPreview";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
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
import type {
  BusRoute,
  BusRouteStop,
  BusSighting,
  BusStop,
} from "../types/domain";

export type BusSightingScreenProps = {
  onBack?: () => void;
  /** Optional callback for the header (i) icon. When provided, the icon
   *  renders and tapping it opens the per-route info screen. Phase 1 wires
   *  this to a Coming Soon stub; Phase 2 will replace the stub. */
  onOpenRouteInfo?: () => void;
  /** Optional callback for the "버스 도착 시간 기록 보기" entry row that
   *  renders above the recorder body, matching the Figma frame. Phase 1
   *  wires this to a Coming Soon stub; Phase 2 will replace the stub. */
  onOpenArrivalTimes?: () => void;
};

type LocationStatus = "loading" | "granted" | "denied" | "error";

// The five-state flow follows the Figma frame the user shared on 2026-05-23
// and the refinement spec at docs/superpowers/specs/2026-05-23-bus-archive-
// flow-refinement.md. The screen is a single component that switches its
// body based on `flowState`; the live clock, the location watcher, and the
// pager strip render across all states so the UI feels continuous.
type FlowState =
  | "recorder"
  | "confirmation"
  | "route-grid"
  | "stop-selection"
  | "confirmed";

const LOCATION_DISTANCE_INTERVAL_M = 10;
const CLOCK_TICK_MS = 1_000;
const MAP_HORIZONTAL_PADDING = spacing.screenX * 2;
const CONFIRMATION_MAP_HEIGHT = 160;
const STOP_SELECT_MAP_HEIGHT = 260;

export function BusSightingScreen({
  onBack,
  onOpenRouteInfo,
  onOpenArrivalTimes,
}: BusSightingScreenProps) {
  // The map previews stretch to fill the phone-width content area minus
  // the screen horizontal padding. We cap the working width at 430 px
  // (iPhone 14 Pro Max) so the diagram does not balloon on desktop web
  // builds; everything beyond that turns into surrounding whitespace
  // instead of stretched UI.
  const { width: windowWidth } = useWindowDimensions();
  const PHONE_MAX_WIDTH = 430;
  const mapWidth = Math.max(
    Math.min(windowWidth, PHONE_MAX_WIDTH) - MAP_HORIZONTAL_PADDING,
    240,
  );

  const [flowState, setFlowState] = useState<FlowState>("recorder");

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("loading");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [routeStops, setRouteStops] = useState<BusRouteStop[]>([]);

  // Frozen at the moment the user pressed the recorder bus button. The pager
  // and the "이 정류장이 맞나요?" panel both read from this so the values do
  // not jitter while the user is still on the confirmation screen.
  const [inferredResult, setInferredResult] = useState<
    InferenceResult<BusRoute, BusStop> | null
  >(null);

  // The coordinate captured at the moment the bus button was pressed. We
  // commit *this* to the server rather than the latest `userLocation`, so
  // the snap result the server computes matches the stop the user
  // confirmed on screen. Without this, a position update arriving between
  // "맞아요" tap and the network call could shift the server snap to a
  // neighboring stop.
  const [committedLocation, setCommittedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [chosenRouteId, setChosenRouteId] = useState<string | null>(null);
  const [chosenStopId, setChosenStopId] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recentRecord, setRecentRecord] = useState<BusSighting | null>(null);
  // The route id we committed alongside `recentRecord`. Needed because the
  // returned sighting carries the routeId but the UI label wants the human
  // code and name from the route catalog.
  const [recordedRouteId, setRecordedRouteId] = useState<string | null>(null);

  const [now, setNow] = useState(() => new Date());

  // The location subscription is kept in a ref so the cleanup in the unmount
  // effect can remove it even if a re-render replaces the watcher reference.
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // 1) Load routes + stops + route-stops once. The bundle is small enough
  //    that a single Promise.all is the cheapest path; we do not paginate
  //    because the topology rarely changes and never grows past a few dozen
  //    rows in the prototype.
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
        // The screen still renders if the topology load fails; the user
        // simply cannot start a confirmation because liveInference returns
        // null when routes/stops are empty. We log so live-mode failures
        // are visible during debugging.
        if (cancelled) return;
        console.warn("[BusSightingScreen] failed to load bus topology", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Request foreground location permission and start watching the position.
  //    The cleanup guards both the "subscription resolves after unmount" race
  //    and "remove throws on the web fallback" by catching silently.
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

  // 3) Tick the live clock. A self-scheduling setTimeout (rather than
  //    setInterval) lets the loop be cancelled cleanly on unmount.
  useEffect(() => {
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (cancelled) return;
      setNow(new Date());
      if (cancelled) return;
      timerId = setTimeout(tick, CLOCK_TICK_MS);
    };

    timerId = setTimeout(tick, CLOCK_TICK_MS);

    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        clearTimeout(timerId);
        timerId = undefined;
      }
    };
  }, []);

  // The inference is the same routine the server uses, so the on-screen
  // current-location chip names the stop the server would also snap to. We
  // recompute on every location/topology change but freeze the result into
  // `inferredResult` only when the user actually commits via the bus button.
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

  // The pager strip highlights different routes per state so the user always
  // sees which route the current step is talking about.
  const activeRouteIdForPager = useMemo<string | null>(() => {
    switch (flowState) {
      case "confirmation":
        return inferredResult?.route.id ?? null;
      case "stop-selection":
        return chosenRouteId;
      case "confirmed":
        return recordedRouteId;
      default:
        return null;
    }
  }, [flowState, inferredResult, chosenRouteId, recordedRouteId]);

  // The chosen route's stop catalog for the stop-selection screen.
  const stopsForChosenRoute = useMemo<BusStop[]>(() => {
    if (!chosenRouteId) return [];
    const stopIds = new Set(
      routeStops
        .filter((link) => link.routeId === chosenRouteId)
        .sort((a, b) => a.sequence - b.sequence)
        .map((link) => link.stopId),
    );
    return stops.filter((stop) => stopIds.has(stop.id));
  }, [chosenRouteId, routeStops, stops]);

  const recordedRoute = useMemo<BusRoute | null>(
    () => routes.find((route) => route.id === recordedRouteId) ?? null,
    [routes, recordedRouteId],
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
    // Always prefer the location captured when the user first pressed the
    // bus button; only fall back to the live location when no commit point
    // exists yet (the rejection branch can enter stop-selection without
    // first going through the bus button on the recorder).
    const location = committedLocation ?? userLocation;
    if (!location) return;
    setRecording(true);
    setRecordError(null);
    try {
      const sighting = await recordBusSighting({
        routeId,
        stopId,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setRecentRecord(sighting);
      setRecordedRouteId(routeId);
      setFlowState("confirmed");
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
    setFlowState("route-grid");
  };

  const handleRouteTile = (routeId: string) => {
    setChosenRouteId(routeId);
    setChosenStopId(null);
    setRecordError(null);
    setFlowState("stop-selection");
  };

  const handleStopTile = (stopId: string) => {
    setChosenStopId(stopId);
  };

  const handleFinalConfirm = () => {
    if (!chosenRouteId || !chosenStopId) return;
    void commitSighting(chosenRouteId, chosenStopId);
  };

  const handleRestart = () => {
    setFlowState("recorder");
    setInferredResult(null);
    setCommittedLocation(null);
    setChosenRouteId(null);
    setChosenStopId(null);
    setRecentRecord(null);
    setRecordedRouteId(null);
    setRecordError(null);
  };

  // The back affordance walks the state machine in reverse instead of
  // popping the screen, except in the recorder and confirmed states where
  // there is no previous step to return to.
  const handleStateBack = () => {
    switch (flowState) {
      case "confirmation":
        setFlowState("recorder");
        setInferredResult(null);
        setCommittedLocation(null);
        return;
      case "route-grid":
        setFlowState("confirmation");
        return;
      case "stop-selection":
        setFlowState("route-grid");
        setChosenStopId(null);
        return;
      case "recorder":
      case "confirmed":
      default:
        onBack?.();
        return;
    }
  };

  return (
    <View style={styles.root}>
      <Header
        title="버스 아카이빙"
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PagerStrip routes={routes} activeRouteId={activeRouteIdForPager} />

        {flowState === "recorder" ? (
          <RecorderView
            now={now}
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

        {flowState === "route-grid" ? (
          <RouteGridView routes={routes} onSelect={handleRouteTile} />
        ) : null}

        {flowState === "stop-selection" && chosenRouteId ? (
          <StopSelectionView
            route={routes.find((route) => route.id === chosenRouteId) ?? null}
            routeId={chosenRouteId}
            stops={stops}
            routeStops={routeStops}
            stopsForRoute={stopsForChosenRoute}
            mapWidth={mapWidth}
            chosenStopId={chosenStopId}
            recording={recording}
            recordError={recordError}
            onPickStop={handleStopTile}
            onConfirm={handleFinalConfirm}
          />
        ) : null}

        {flowState === "confirmed" && recentRecord ? (
          <ConfirmedView
            sighting={recentRecord}
            route={recordedRoute}
            stops={stops}
            onRestart={handleRestart}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pager strip
// ---------------------------------------------------------------------------

function PagerStrip({
  routes,
  activeRouteId,
}: {
  routes: BusRoute[];
  activeRouteId: string | null;
}) {
  if (routes.length === 0) {
    return null;
  }
  return (
    <View style={styles.pagerStrip} accessibilityLabel="호선 인디케이터">
      {routes.map((route, index) => {
        const active = route.id === activeRouteId;
        return (
          <View
            key={route.id}
            style={[styles.pagerChip, active && styles.pagerChipActive]}
            accessibilityLabel={`${index + 1}호선${active ? " (선택됨)" : ""}`}
          >
            <Text
              style={[styles.pagerText, active && styles.pagerTextActive]}
            >
              {index + 1}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Recorder view (state 1)
// ---------------------------------------------------------------------------

function RecorderView({
  now,
  locationStatus,
  userLocation,
  liveInference,
  canStartConfirmation,
  onPressBusButton,
  onOpenArrivalTimes,
}: {
  now: Date;
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="버스 도착 시간 기록 보기"
          onPress={onOpenArrivalTimes}
          testID="bus-sighting-arrival-times-entry"
          style={({ pressed }) => [
            styles.arrivalEntry,
            pressed && styles.arrivalEntryPressed,
          ]}
        >
          <Clock3 size={16} color={colors.mintDark} strokeWidth={2.2} />
          <Text style={styles.arrivalEntryLabel}>버스 도착 시간 기록 보기</Text>
          <ChevronRight size={16} color={colors.gray400} />
        </Pressable>
      ) : null}

      <Text accessibilityRole="header" style={styles.headline}>
        방금 버스 봤어요!
      </Text>

      <Text style={styles.clock} accessibilityLabel="현재 시각">
        {formatClock(now)}
      </Text>

      <View style={styles.locationChip}>
        <View style={styles.locationDot} />
        <Text style={styles.locationText} numberOfLines={1}>
          현위치: {liveInference ? liveInference.stop.name : "확인 중"}
        </Text>
      </View>

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
        <Bus
          size={56}
          color={canStartConfirmation ? colors.blue : colors.gray400}
          strokeWidth={2.2}
        />
      </Pressable>

      <Text style={styles.helpText}>{helpText}</Text>
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
// Confirmation view (state 2)
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

      <Text style={styles.confirmRouteName}>{inference.route.name}</Text>

      <View style={styles.stopCard}>
        <MapPin size={18} color={colors.mintDark} strokeWidth={2.4} />
        <Text style={styles.stopCardText}>{inference.stop.name}</Text>
      </View>

      <View style={styles.mapWrapper}>
        <RouteMapPreview
          routeId={inference.route.id}
          stops={stops}
          routeStops={routeStops}
          width={mapWidth}
          height={CONFIRMATION_MAP_HEIGHT}
          highlightedStopId={inference.stop.id}
          showLabels
        />
      </View>

      {recordError ? (
        <Text style={styles.errorText}>{recordError}</Text>
      ) : null}

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
            pressed && styles.rejectButtonPressed,
            recording && styles.buttonDisabled,
          ]}
        >
          <AlertTriangle size={16} color={colors.red} strokeWidth={2.4} />
          <Text style={styles.rejectButtonText}>틀려요</Text>
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
            pressed && styles.acceptButtonPressed,
            recording && styles.buttonDisabled,
          ]}
        >
          <Bus size={16} color={colors.black} strokeWidth={2.4} />
          <Text style={styles.acceptButtonText}>
            {recording ? "기록 중" : "맞아요"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Route grid view (state 3)
// ---------------------------------------------------------------------------

function RouteGridView({
  routes,
  onSelect,
}: {
  routes: BusRoute[];
  onSelect: (routeId: string) => void;
}) {
  return (
    <View style={styles.stateBlock}>
      <Text accessibilityRole="header" style={styles.confirmHeadline}>
        기록을 원하시는 호선을 골라주세요
      </Text>
      <View style={styles.routeGrid}>
        {routes.map((route, index) => (
          <Pressable
            key={route.id}
            accessibilityRole="button"
            accessibilityLabel={`${route.name} 선택`}
            onPress={() => onSelect(route.id)}
            testID={`bus-sighting-route-tile-${route.code}`}
            style={({ pressed }) => [
              styles.routeTile,
              pressed && styles.routeTilePressed,
            ]}
          >
            <View style={styles.routeTileNumber}>
              <Text style={styles.routeTileNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.routeTileName}>{route.name}</Text>
            <Bus size={20} color={colors.mintDark} strokeWidth={2.2} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stop selection view (state 4)
// ---------------------------------------------------------------------------

function StopSelectionView({
  route,
  routeId,
  stops,
  routeStops,
  stopsForRoute,
  mapWidth,
  chosenStopId,
  recording,
  recordError,
  onPickStop,
  onConfirm,
}: {
  route: BusRoute | null;
  routeId: string;
  stops: BusStop[];
  routeStops: BusRouteStop[];
  stopsForRoute: BusStop[];
  mapWidth: number;
  chosenStopId: string | null;
  recording: boolean;
  recordError: string | null;
  onPickStop: (stopId: string) => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.stateBlock}>
      <Text accessibilityRole="header" style={styles.confirmHeadline}>
        해당 노선에서 정류장을 선택해주세요
      </Text>
      <Text style={styles.confirmRouteName}>{route?.name ?? ""}</Text>

      <View style={styles.mapWrapper}>
        <RouteMapPreview
          routeId={routeId}
          stops={stops}
          routeStops={routeStops}
          width={mapWidth}
          height={STOP_SELECT_MAP_HEIGHT}
          highlightedStopId={chosenStopId}
          onPickStop={onPickStop}
          showLabels
        />
      </View>

      <Text style={styles.stopSelectionHint}>
        지도의 정류장을 눌러 선택하세요. ({stopsForRoute.length}개 정류장)
      </Text>

      {recordError ? (
        <Text style={styles.errorText}>{recordError}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="확정"
        accessibilityState={{ disabled: !chosenStopId || recording }}
        disabled={!chosenStopId || recording}
        onPress={onConfirm}
        testID="bus-sighting-final-confirm-button"
        style={({ pressed }) => [
          styles.finalConfirmButton,
          (!chosenStopId || recording) && styles.buttonDisabled,
          pressed && chosenStopId && !recording && styles.finalConfirmButtonPressed,
        ]}
      >
        <Text style={styles.finalConfirmButtonText}>
          {recording ? "기록 중" : "확정"}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Confirmed view (state 5)
// ---------------------------------------------------------------------------

function ConfirmedView({
  sighting,
  route,
  stops,
  onRestart,
}: {
  sighting: BusSighting;
  route: BusRoute | null;
  stops: BusStop[];
  onRestart: () => void;
}) {
  const stopName = stops.find((stop) => stop.id === sighting.stopId)?.name
    ?? sighting.stopId;

  return (
    <View style={styles.stateBlock}>
      <View style={styles.confirmedBadge}>
        <Check size={28} color={colors.mintDark} strokeWidth={2.6} />
      </View>
      <Text accessibilityRole="header" style={styles.confirmedHeadline}>
        확정이 되었습니다
      </Text>
      <Text style={styles.confirmedSubtext}>감사합니다 :)</Text>

      <View style={styles.recentRecord} testID="bus-sighting-recent">
        <Text style={styles.recentRecordTitle}>최근 기록</Text>
        <View style={styles.recentRecordRow}>
          <MapPin size={14} color={colors.mintDark} />
          <Text style={styles.recentRecordText}>
            {formatClock(new Date(sighting.createdAt))} {" · "}
            {stopName}
            {route ? ` · ${route.code}` : ""}
          </Text>
        </View>
        <Text style={styles.recentRecordHint}>
          기록자 ID: {sighting.reporterLabel}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다시 기록하기"
        onPress={onRestart}
        testID="bus-sighting-restart-button"
        style={({ pressed }) => [
          styles.restartButton,
          pressed && styles.restartButtonPressed,
        ]}
      >
        <Text style={styles.restartButtonText}>다시 기록하기</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatClock(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
  pagerStrip: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  pagerChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pagerChipActive: {
    borderColor: colors.mintDark,
    backgroundColor: colors.yellow,
  },
  pagerText: {
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  pagerTextActive: {
    color: colors.black,
  },

  // recorder
  headline: {
    marginTop: 18,
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
  arrivalEntry: {
    marginTop: 8,
    minHeight: 44,
    width: "100%",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.line,
  },
  arrivalEntryPressed: {
    backgroundColor: colors.mintLight,
  },
  arrivalEntryLabel: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
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

  // confirmation
  confirmHeadline: {
    marginTop: 18,
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  confirmRouteName: {
    marginTop: 8,
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  stopCard: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  stopCardText: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  mapWrapper: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  stopSelectionHint: {
    marginTop: 10,
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: "center",
  },
  errorText: {
    marginTop: 12,
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: "center",
  },
  confirmButtonRow: {
    marginTop: 18,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  pillButton: {
    minWidth: 120,
    paddingHorizontal: 20,
    minHeight: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectButton: {
    backgroundColor: colors.gray100,
  },
  rejectButtonPressed: {
    opacity: 0.82,
  },
  rejectButtonText: {
    color: colors.grayIcon,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  acceptButton: {
    backgroundColor: colors.yellow,
  },
  acceptButtonPressed: {
    opacity: 0.86,
  },
  acceptButtonText: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  buttonDisabled: {
    opacity: 0.55,
  },

  // route grid
  routeGrid: {
    marginTop: 18,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  routeTile: {
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeTilePressed: {
    backgroundColor: colors.mintLight,
  },
  routeTileNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mintDark,
    alignItems: "center",
    justifyContent: "center",
  },
  routeTileNumberText: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  routeTileName: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },

  finalConfirmButton: {
    marginTop: 18,
    width: "100%",
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  finalConfirmButtonPressed: {
    opacity: 0.88,
  },
  finalConfirmButtonText: {
    color: colors.surface,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },

  // confirmed
  confirmedBadge: {
    marginTop: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedHeadline: {
    marginTop: 14,
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  confirmedSubtext: {
    marginTop: 4,
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  recentRecord: {
    marginTop: 24,
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
  restartButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mintDark,
    alignItems: "center",
    justifyContent: "center",
  },
  restartButtonPressed: {
    backgroundColor: colors.mintLight,
  },
  restartButtonText: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
});
