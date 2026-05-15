export type PlaceCandidate = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: "api" | "fallback";
};
