import { Platform, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import type { DairuriMapProps } from "./DairuriMap.types";

export function DairuriMap({ initialRegion, rides }: DairuriMapProps) {
  return (
    <MapView
      accessibilityLabel="다로리 주변 지도"
      initialRegion={initialRegion}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      showsUserLocation
      style={StyleSheet.absoluteFillObject}
    >
      {rides.map((ride) => (
        <Marker
          key={ride.id}
          coordinate={{
            latitude: ride.location.lat,
            longitude: ride.location.lng,
          }}
          description={`${ride.departureName}에서 ${ride.destinationName}`}
          title={ride.title}
        />
      ))}
    </MapView>
  );
}
