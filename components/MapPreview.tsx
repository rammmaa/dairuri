import { StyleProp, ViewStyle } from "react-native";

import { NaverMapSurface } from "./NaverMapSurface";
import {
  defaultMapPreviewCamera,
  mapPreviewMarkers,
} from "./mapPreviewData";

type MapPreviewProps = {
  style?: StyleProp<ViewStyle>;
  onMarkerPress?: (markerId: string) => void;
};

export function MapPreview({ style, onMarkerPress }: MapPreviewProps) {
  return (
    <NaverMapSurface
      style={style}
      markers={mapPreviewMarkers}
      initialCamera={defaultMapPreviewCamera}
      onMarkerPress={onMarkerPress}
    />
  );
}

export default MapPreview;
