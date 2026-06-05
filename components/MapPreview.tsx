import { StyleProp, ViewStyle } from "react-native";

import { NaverMapSurface } from "./NaverMapSurface";
import {
  defaultMapPreviewCamera,
  type MapPreviewCamera,
  type MapPreviewMarker,
} from "./mapPreviewData";

type MapPreviewProps = {
  style?: StyleProp<ViewStyle>;
  camera?: MapPreviewCamera;
  markers?: MapPreviewMarker[];
  onMarkerPress?: (markerId: string) => void;
};

export function MapPreview({
  style,
  camera,
  markers = [],
  onMarkerPress,
}: MapPreviewProps) {
  return (
    <NaverMapSurface
      style={style}
      markers={markers}
      initialCamera={defaultMapPreviewCamera}
      camera={camera}
      onMarkerPress={onMarkerPress}
    />
  );
}

export default MapPreview;
