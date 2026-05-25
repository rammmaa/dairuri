import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import type { BusRouteStop, BusStop } from "../types/domain";

/**
 * `geographic` projects the real stop latitudes and longitudes into the
 * preview box and is honest about the route's actual shape. `schematic`
 * arranges the stops into a stadium / line / rectangle layout chosen by
 * stop count so the diagram reads cleanly even when the placeholder
 * coordinates put the polyline in an awkward shape. The Figma flow uses a
 * schematic stadium for the stop-selection screen.
 */
export type RouteMapLayout = "geographic" | "schematic";

export type RouteMapPreviewProps = {
  /** All stops in the catalog. The component filters down to the route's
   *  stops by joining against `routeStops`. */
  stops: BusStop[];
  /** Every route-stop link in the catalog. Component filters to `routeId`. */
  routeStops: BusRouteStop[];
  routeId: string;
  /** Outer width of the preview. Coordinates are projected into this box. */
  width: number;
  /** Outer height of the preview. */
  height: number;
  /** Layout strategy; defaults to `schematic` so the diagram reads cleanly
   *  even with placeholder coordinates. */
  layout?: RouteMapLayout;
  /** Highlighted stop, drawn larger and filled with the accent color. */
  highlightedStopId?: string | null;
  /** When provided, every stop pin becomes pressable and forwards taps. */
  onPickStop?: (stopId: string) => void;
  /** When true, the stop name renders below each pin. */
  showLabels?: boolean;
};

type Projected = {
  stop: BusStop;
  x: number;
  y: number;
};

function projectGeographic(
  orderedStops: BusStop[],
  width: number,
  height: number,
): Projected[] {
  const lats = orderedStops.map((stop) => stop.latitude);
  const lngs = orderedStops.map((stop) => stop.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // Guard against zero-range routes (one stop, or coincident stops): give
  // them an artificial epsilon so the projection still produces a finite
  // center point instead of NaN.
  const latRange = Math.max(maxLat - minLat, 0.0001);
  const lngRange = Math.max(maxLng - minLng, 0.0001);

  return orderedStops.map((stop) => ({
    stop,
    x:
      ((stop.longitude - minLng) / lngRange) * (width - 2 * PADDING) +
      PADDING,
    y: ((maxLat - stop.latitude) / latRange) * (height - 2 * PADDING) + PADDING,
  }));
}

/**
 * Position stops in a clean diagrammatic layout chosen by stop count. The
 * Figma stop-selection frame uses a six-pin stadium; we match that for
 * counts of five or more, fall back to a simple rectangle for four stops,
 * and to a straight line for three or fewer.
 */
function projectSchematic(
  orderedStops: BusStop[],
  width: number,
  height: number,
): Projected[] {
  const count = orderedStops.length;
  const usableWidth = Math.max(width - 2 * PADDING, 0);
  const usableHeight = Math.max(height - 2 * PADDING, 0);
  const left = PADDING;
  const right = PADDING + usableWidth;
  const top = PADDING + usableHeight * 0.32;
  const bottom = PADDING + usableHeight * 0.68;
  const mid = PADDING + usableHeight / 2;

  const placements: { x: number; y: number }[] = [];

  if (count <= 1) {
    placements.push({ x: PADDING + usableWidth / 2, y: mid });
  } else if (count === 2) {
    placements.push({ x: left, y: mid });
    placements.push({ x: right, y: mid });
  } else if (count === 3) {
    placements.push({ x: left, y: mid });
    placements.push({ x: PADDING + usableWidth / 2, y: mid });
    placements.push({ x: right, y: mid });
  } else if (count === 4) {
    // Rectangle: top-left, top-right, bottom-right, bottom-left so the
    // polyline reads as a closed loop along three sides.
    placements.push({ x: left, y: top });
    placements.push({ x: right, y: top });
    placements.push({ x: right, y: bottom });
    placements.push({ x: left, y: bottom });
  } else {
    // Stadium: top row left to right, bottom row right to left, so the
    // polyline walks one side and returns along the other. Splits half
    // up, the remainder down, so 5 stops = 3 top + 2 bottom.
    const topCount = Math.ceil(count / 2);
    const bottomCount = count - topCount;
    for (let i = 0; i < topCount; i += 1) {
      const t = topCount === 1 ? 0.5 : i / (topCount - 1);
      placements.push({ x: left + usableWidth * t, y: top });
    }
    for (let i = 0; i < bottomCount; i += 1) {
      const t = bottomCount === 1 ? 0.5 : i / (bottomCount - 1);
      // right-to-left traversal so the stadium connects naturally
      placements.push({ x: right - usableWidth * t, y: bottom });
    }
  }

  return orderedStops.map((stop, index) => ({
    stop,
    x: placements[index].x,
    y: placements[index].y,
  }));
}

const PADDING = 24;
const STOP_RADIUS = 6;
const HIGHLIGHTED_RADIUS = 9;
const HIT_SLOP = 14;

/**
 * Lightweight route-and-stops visualization. Renders the route's stops as
 * pins along an SVG polyline projected from latitude/longitude into the
 * preview box. Coordinates are normalized to the bounding box of the route's
 * stops, so the preview always fills the available area regardless of how
 * tight or loose the actual geometry is.
 *
 * No real map tile layer is loaded; this is a schematic visualization that
 * stands in for a Naver Maps surface until the live map work lands. Stop
 * coordinates are the same placeholders the rest of the bus archive uses,
 * so the polyline is meaningful as a route shape but does not reflect real
 * Cheongdo geography.
 */
export function RouteMapPreview({
  stops,
  routeStops,
  routeId,
  width,
  height,
  layout = "schematic",
  highlightedStopId,
  onPickStop,
  showLabels = false,
}: RouteMapPreviewProps) {
  const orderedStops = routeStops
    .filter((link) => link.routeId === routeId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((link) => stops.find((stop) => stop.id === link.stopId))
    .filter((stop): stop is BusStop => Boolean(stop));

  if (orderedStops.length === 0) {
    return (
      <View
        style={[styles.surface, { width, height }]}
        accessibilityLabel="노선 정보 없음"
      >
        <Text style={styles.emptyText}>표시할 노선이 없어요</Text>
      </View>
    );
  }

  const projected =
    layout === "geographic"
      ? projectGeographic(orderedStops, width, height)
      : projectSchematic(orderedStops, width, height);

  const polylinePoints = projected
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <View
      style={[styles.surface, { width, height }]}
      accessibilityLabel="노선 미리보기"
    >
      <Svg width={width} height={height} pointerEvents="none">
        <Polyline
          points={polylinePoints}
          stroke={colors.mintDark}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {projected.map((point) => {
          const highlighted = point.stop.id === highlightedStopId;
          return (
            <Circle
              key={point.stop.id}
              cx={point.x}
              cy={point.y}
              r={highlighted ? HIGHLIGHTED_RADIUS : STOP_RADIUS}
              fill={highlighted ? colors.yellow : colors.surface}
              stroke={colors.mintDark}
              strokeWidth={highlighted ? 2.4 : 1.6}
            />
          );
        })}
      </Svg>

      {/* Touch overlays for each pin. Rendered on top of the SVG so RN
          gesture handling stays simple. The SVG itself has pointerEvents
          disabled to avoid intercepting these taps. */}
      {onPickStop
        ? projected.map((point) => (
            <Pressable
              key={`hit-${point.stop.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${point.stop.name} 선택`}
              accessibilityState={{
                selected: point.stop.id === highlightedStopId,
              }}
              onPress={() => onPickStop(point.stop.id)}
              hitSlop={HIT_SLOP}
              testID={`route-map-pin-${point.stop.id}`}
              style={[
                styles.hitArea,
                {
                  left: point.x - (HIGHLIGHTED_RADIUS + 2),
                  top: point.y - (HIGHLIGHTED_RADIUS + 2),
                  width: (HIGHLIGHTED_RADIUS + 2) * 2,
                  height: (HIGHLIGHTED_RADIUS + 2) * 2,
                },
              ]}
            />
          ))
        : null}

      {showLabels
        ? projected.map((point) => {
            // Place the label above the pin when it sits in the top half of
            // the canvas, and below otherwise. Stadium layouts therefore
            // surround the polyline with their stop names instead of
            // stacking them all below.
            const labelAbove = point.y < height / 2;
            return (
              <View
                key={`label-${point.stop.id}`}
                style={[
                  styles.label,
                  {
                    left: point.x - 60,
                    top: labelAbove
                      ? Math.max(2, point.y - HIGHLIGHTED_RADIUS - 22)
                      : Math.min(
                          point.y + HIGHLIGHTED_RADIUS + 6,
                          height - 18,
                        ),
                  },
                ]}
                pointerEvents="none"
              >
                <Text
                  style={styles.labelText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {point.stop.name}
                </Text>
              </View>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.mapBase,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  emptyText: {
    flex: 1,
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: "center",
    textAlignVertical: "center",
    padding: 12,
  },
  hitArea: {
    position: "absolute",
    borderRadius: 999,
  },
  label: {
    position: "absolute",
    width: 120,
    alignItems: "center",
  },
  labelText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: 10,
    lineHeight: 13,
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
