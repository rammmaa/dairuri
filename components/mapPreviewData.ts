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
  latitude: 35.6482,
  longitude: 128.7358,
  zoom: 15,
};

export const mapPreviewMarkers: MapPreviewMarker[] = [
  {
    id: "cafe",
    label: "카페",
    latitude: 35.6482,
    longitude: 128.7358,
  },
  {
    id: "bus",
    label: "정류장",
    latitude: 35.6474,
    longitude: 128.7338,
  },
  {
    id: "library",
    label: "도서관",
    latitude: 35.6501,
    longitude: 128.737,
  },
];
