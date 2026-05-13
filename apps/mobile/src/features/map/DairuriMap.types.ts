import type { RideListing } from "@dairuri/shared";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface DairuriMapProps {
  initialRegion: MapRegion;
  rides: RideListing[];
}
