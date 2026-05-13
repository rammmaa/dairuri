import { useMemo, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RideListing } from "@dairuri/shared";
import type { DairuriMapProps, MapRegion } from "./DairuriMap.types";
import { colors } from "../../theme/tokens";

const tileSize = 256;
const defaultMapSize = {
  height: 520,
  width: 430,
};

export function DairuriMap({ initialRegion, rides }: DairuriMapProps) {
  const [mapSize, setMapSize] = useState(defaultMapSize);
  const zoom = getZoomLevel(initialRegion);
  const centerPixel = latLngToWorldPixel(
    initialRegion.latitude,
    initialRegion.longitude,
    zoom,
  );
  const tiles = useMemo(
    () => getVisibleTiles(centerPixel, zoom, mapSize.width, mapSize.height),
    [centerPixel.x, centerPixel.y, mapSize.height, mapSize.width, zoom],
  );
  const markers = useMemo(
    () => getRideMarkers(rides, centerPixel, mapSize.width, mapSize.height, zoom),
    [centerPixel.x, centerPixel.y, mapSize.height, mapSize.width, rides, zoom],
  );

  const updateMapSize = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    if (height > 0 && width > 0) {
      setMapSize({ height, width });
    }
  };

  return (
    <View
      accessibilityLabel="다로리 주변 지도"
      onLayout={updateMapSize}
      style={styles.webMap}
    >
      {tiles.map((tile) => (
        <Image
          key={`${tile.zoom}-${tile.x}-${tile.y}`}
          accessibilityLabel={`실시간 지도 타일 ${tile.zoom}/${tile.x}/${tile.y}`}
          source={{
            uri: `https://tile.openstreetmap.org/${tile.zoom}/${tile.wrappedX}/${tile.y}.png`,
          }}
          style={[
            styles.tile,
            {
              left: tile.left,
              top: tile.top,
            },
          ]}
        />
      ))}
      {markers.map((marker) => (
        <View
          key={marker.id}
          style={[
            styles.marker,
            {
              left: marker.left,
              top: marker.top,
            },
          ]}
        >
          <View style={styles.markerDot} />
          <Text numberOfLines={1} style={styles.markerLabel}>
            {marker.label}
          </Text>
        </View>
      ))}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

function getZoomLevel(region: MapRegion): number {
  const zoom = Math.round(Math.log2(360 / region.longitudeDelta));
  return Math.max(10, Math.min(17, zoom));
}

function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const scale = tileSize * 2 ** zoom;
  const sinLatitude = Math.sin((lat * Math.PI) / 180);
  const x = ((lng + 180) / 360) * scale;
  const y =
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
    scale;

  return { x, y };
}

function getVisibleTiles(
  centerPixel: { x: number; y: number },
  zoom: number,
  width: number,
  height: number,
) {
  const minTileX = Math.floor((centerPixel.x - width / 2) / tileSize);
  const maxTileX = Math.floor((centerPixel.x + width / 2) / tileSize);
  const minTileY = Math.floor((centerPixel.y - height / 2) / tileSize);
  const maxTileY = Math.floor((centerPixel.y + height / 2) / tileSize);
  const tileLimit = 2 ** zoom;
  const tiles = [];

  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      if (y < 0 || y >= tileLimit) {
        continue;
      }

      tiles.push({
        left: x * tileSize - (centerPixel.x - width / 2),
        top: y * tileSize - (centerPixel.y - height / 2),
        wrappedX: wrapTileX(x, tileLimit),
        x,
        y,
        zoom,
      });
    }
  }

  return tiles;
}

function getRideMarkers(
  rides: RideListing[],
  centerPixel: { x: number; y: number },
  width: number,
  height: number,
  zoom: number,
) {
  return rides.map((ride) => {
    const markerPixel = latLngToWorldPixel(
      ride.location.lat,
      ride.location.lng,
      zoom,
    );

    return {
      id: ride.id,
      label: ride.departureName,
      left: width / 2 + markerPixel.x - centerPixel.x,
      top: height / 2 + markerPixel.y - centerPixel.y,
    };
  });
}

function wrapTileX(x: number, tileLimit: number): number {
  return ((x % tileLimit) + tileLimit) % tileLimit;
}

const styles = StyleSheet.create({
  webMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.mapBackground,
    overflow: "hidden",
  },
  tile: {
    position: "absolute",
    width: tileSize,
    height: tileSize,
  },
  marker: {
    position: "absolute",
    maxWidth: 160,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  markerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.active,
  },
  markerLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  attribution: {
    position: "absolute",
    right: 8,
    bottom: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  attributionText: {
    color: colors.grayText,
    fontSize: 10,
    fontWeight: "600",
  },
});
