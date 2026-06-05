import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Polygon, Polyline } from "react-native-svg";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import type { BusRouteStop, BusStop } from "../types/domain";

const TILE = 256;
// Key-free raster basemap (CARTO Voyager). Real streets + labels like the Figma
// reference, no NAVER NCP key required. When a NAVER web/native key is added the
// basemap can be swapped for Naver tiles without touching the overlay logic.
const TILE_TEMPLATE = "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
const MIN_ZOOM = 9;
const MAX_ZOOM = 16;

export type BusRouteMapStyle = "confirmation" | "selection" | "overview";

export type BusRouteMapProps = {
  stops: BusStop[];
  routeStops: BusRouteStop[];
  routeId: string;
  width: number;
  height: number;
  highlightedStopId?: string | null;
  onPickStop?: (stopId: string) => void;
  /** When true, render every stop's name. Defaults to false (only the
   *  highlighted stop is labelled) so dense routes stay readable. */
  showAllLabels?: boolean;
  /** Other routes drawn faintly underneath, so the info screen can show the
   *  whole Happy Bus network with the selected route emphasized. */
  backgroundRouteIds?: string[];
  /** When true, the first stop (기점) and last stop (종점) get distinct pins. */
  markEndpoints?: boolean;
};

function orderRoute(
  stops: BusStop[],
  routeStops: BusRouteStop[],
  routeId: string,
): BusStop[] {
  return routeStops
    .filter((link) => link.routeId === routeId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((link) => stops.find((stop) => stop.id === link.stopId))
    .filter((stop): stop is BusStop => Boolean(stop));
}

function lonToX(lon: number, z: number): number {
  return ((lon + 180) / 360) * Math.pow(2, z);
}

function latToY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z)
  );
}

/**
 * Picks the largest zoom at which the route's bounding box still fits inside the
 * preview box (with padding), so short routes zoom in and long routes zoom out.
 */
function chooseZoom(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  width: number,
  height: number,
): number {
  const usableW = width * 0.82;
  const usableH = height * 0.82;
  for (let z = MAX_ZOOM; z >= MIN_ZOOM; z -= 1) {
    const spanX = Math.abs(lonToX(maxLng, z) - lonToX(minLng, z)) * TILE;
    const spanY = Math.abs(latToY(maxLat, z) - latToY(minLat, z)) * TILE;
    if (spanX <= usableW && spanY <= usableH) {
      return z;
    }
  }
  return MIN_ZOOM;
}

/**
 * A route drawn over a real raster basemap: stop pins along the route polyline,
 * with the highlighted (recording / selected) stop enlarged. Used on the bus
 * confirmation screen and the route-info overview.
 */
export function BusRouteMap({
  stops,
  routeStops,
  routeId,
  width,
  height,
  highlightedStopId,
  onPickStop,
  showAllLabels = false,
  backgroundRouteIds = [],
  markEndpoints = false,
}: BusRouteMapProps) {
  const orderedStops = orderRoute(stops, routeStops, routeId);
  const backgroundRoutes = backgroundRouteIds
    .filter((id) => id !== routeId)
    .map((id) => orderRoute(stops, routeStops, id))
    .filter((ordered) => ordered.length > 0);

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

  const bboxStops = [...orderedStops, ...backgroundRoutes.flat()];
  const lats = bboxStops.map((s) => s.latitude);
  const lngs = bboxStops.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const zoom = chooseZoom(minLat, maxLat, minLng, maxLng, width, height);

  // Origin (top-left of the preview box) in absolute world pixels.
  const originX = lonToX(centerLng, zoom) * TILE - width / 2;
  const originY = latToY(centerLat, zoom) * TILE - height / 2;

  const project = (lat: number, lng: number) => ({
    x: lonToX(lng, zoom) * TILE - originX,
    y: latToY(lat, zoom) * TILE - originY,
  });

  // Tiles needed to fill the box.
  const tileXStart = Math.floor(originX / TILE);
  const tileXEnd = Math.floor((originX + width) / TILE);
  const tileYStart = Math.floor(originY / TILE);
  const tileYEnd = Math.floor((originY + height) / TILE);
  const tileCount = Math.pow(2, zoom);

  const tiles: { key: string; left: number; top: number; uri: string }[] = [];
  for (let tx = tileXStart; tx <= tileXEnd; tx += 1) {
    for (let ty = tileYStart; ty <= tileYEnd; ty += 1) {
      // Wrap X, clamp Y to valid tile range.
      const wrappedX = ((tx % tileCount) + tileCount) % tileCount;
      if (ty < 0 || ty >= tileCount) continue;
      tiles.push({
        key: `${tx}-${ty}`,
        left: tx * TILE - originX,
        top: ty * TILE - originY,
        uri: TILE_TEMPLATE.replace("{z}", String(zoom))
          .replace("{x}", String(wrappedX))
          .replace("{y}", String(ty)),
      });
    }
  }

  const projected = orderedStops.map((stop) => ({ stop, ...project(stop.latitude, stop.longitude) }));
  const polylinePoints = projected.map((p) => `${p.x},${p.y}`).join(" ");
  const backgroundPolylines = backgroundRoutes.map((ordered) =>
    ordered
      .map((stop) => {
        const p = project(stop.latitude, stop.longitude);
        return `${p.x},${p.y}`;
      })
      .join(" "),
  );

  // A few direction arrows along the route so the travel direction reads at a
  // glance. Sampled at ~1/4, 1/2, 3/4 of the segments to avoid clutter.
  const segmentCount = projected.length - 1;
  const arrows = (segmentCount >= 1 ? [0.25, 0.5, 0.75] : [])
    .map((fraction) => Math.min(segmentCount - 1, Math.floor(fraction * segmentCount)))
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((index) => {
      const a = projected[index];
      const b = projected[index + 1];
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      return { key: `arrow-${index}`, midX, midY, deg };
    });

  return (
    <View
      style={[styles.surface, { width, height }]}
      accessibilityLabel="노선 지도"
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.uri }}
          style={[styles.tile, { left: tile.left, top: tile.top }]}
        />
      ))}

      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {backgroundPolylines.map((points, index) => (
          <Polyline
            key={`bg-${index}`}
            points={points}
            stroke={colors.gray400}
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        <Polyline
          points={polylinePoints}
          stroke={colors.red}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {arrows.map((arrow) => (
          <Polygon
            key={arrow.key}
            points={`${arrow.midX - 4},${arrow.midY - 3.5} ${arrow.midX + 5},${arrow.midY} ${arrow.midX - 4},${arrow.midY + 3.5}`}
            fill={colors.red}
            transform={`rotate(${arrow.deg} ${arrow.midX} ${arrow.midY})`}
          />
        ))}
        {projected.map((p, index) => {
          const highlighted = p.stop.id === highlightedStopId;
          const isStart = markEndpoints && index === 0;
          const isEnd = markEndpoints && index === projected.length - 1;
          // Marker convention from the Figma route-info frames: the origin is
          // a large filled circle, the terminus is a double ring, a normal
          // stop is a small circle, and the recording stop is the yellow pin.
          if (highlighted) {
            return (
              <Circle
                key={p.stop.id}
                cx={p.x}
                cy={p.y}
                r={8}
                fill={colors.yellow}
                stroke={colors.black}
                strokeWidth={2.4}
              />
            );
          }
          if (isStart) {
            return (
              <Circle
                key={p.stop.id}
                cx={p.x}
                cy={p.y}
                r={8}
                fill={colors.mintDark}
                stroke={colors.surface}
                strokeWidth={2}
              />
            );
          }
          if (isEnd) {
            return (
              <G key={p.stop.id}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  fill={colors.surface}
                  stroke={colors.red}
                  strokeWidth={2.2}
                />
                <Circle cx={p.x} cy={p.y} r={4} fill={colors.red} />
              </G>
            );
          }
          return (
            <Circle
              key={p.stop.id}
              cx={p.x}
              cy={p.y}
              r={4.5}
              fill={colors.surface}
              stroke={colors.red}
              strokeWidth={1.8}
            />
          );
        })}
      </Svg>

      {projected.map((p) => {
        const highlighted = p.stop.id === highlightedStopId;
        if (!showAllLabels && !highlighted) return null;
        return (
          <View
            key={`label-${p.stop.id}`}
            pointerEvents="none"
            style={[
              styles.label,
              {
                left: Math.max(2, Math.min(p.x - 50, width - 102)),
                top: Math.max(2, p.y - 24),
              },
            ]}
          >
            <Text
              style={[styles.labelText, highlighted && styles.labelTextHighlighted]}
              numberOfLines={1}
            >
              {p.stop.name}
            </Text>
          </View>
        );
      })}

      {onPickStop
        ? projected.map((p) => (
            <Pressable
              key={`hit-${p.stop.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${p.stop.name} 선택`}
              accessibilityState={{ selected: p.stop.id === highlightedStopId }}
              onPress={() => onPickStop(p.stop.id)}
              hitSlop={12}
              testID={`bus-route-map-pin-${p.stop.id}`}
              style={[
                styles.hitArea,
                { left: p.x - 11, top: p.y - 11 },
              ]}
            />
          ))
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
  tile: {
    position: "absolute",
    width: TILE,
    height: TILE,
  },
  emptyText: {
    flex: 1,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    textAlign: "center",
    textAlignVertical: "center",
    padding: 12,
  },
  label: {
    position: "absolute",
    width: 100,
    alignItems: "center",
  },
  labelText: {
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    backgroundColor: colors.surfaceTranslucent,
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  labelTextHighlighted: {
    color: colors.black,
    fontFamily: typography.family.bold,
    backgroundColor: colors.yellow,
  },
  hitArea: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
