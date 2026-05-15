import { StyleProp, ViewStyle } from "react-native";

import { NaverMapSurface } from "./NaverMapSurface";
import {
  defaultMapPreviewCamera,
  mapPreviewMarkers,
  type MapPreviewCamera,
} from "./mapPreviewData";

type MapPreviewProps = {
  style?: StyleProp<ViewStyle>;
  camera?: MapPreviewCamera;
  onMarkerPress?: (markerId: string) => void;
};

export function MapPreview({ style, camera, onMarkerPress }: MapPreviewProps) {
  return (
    <NaverMapSurface
      style={style}
      markers={mapPreviewMarkers}
      initialCamera={defaultMapPreviewCamera}
      camera={camera}
      onMarkerPress={onMarkerPress}
    />
  );
}

export default MapPreview;
