export type MapPreviewCamera = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export type MapPreviewMarker = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export const defaultMapPreviewCamera: MapPreviewCamera = {
  latitude: 37.5572,
  longitude: 126.9246,
  zoom: 15,
};

export const mapPreviewMarkers: MapPreviewMarker[] = [
  {
    id: "cafe",
    label: "카페",
    latitude: 37.5572,
    longitude: 126.9246,
  },
  {
    id: "bus",
    label: "정류장",
    latitude: 37.5591,
    longitude: 126.9272,
  },
  {
    id: "library",
    label: "도서관",
    latitude: 37.5606,
    longitude: 126.9228,
  },
];
