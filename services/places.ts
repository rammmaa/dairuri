import type { PlaceCandidate } from "../types/place";
import { apiRequest, hasLiveApiBaseUrl } from "./apiClient";

export async function searchPlaceCandidates(
  query: string,
): Promise<PlaceCandidate[]> {
  const trimmedQuery = query.trim();

  if (
    trimmedQuery.length < 2 ||
    !hasLiveApiBaseUrl() ||
    typeof fetch !== "function"
  ) {
    return [];
  }

  return apiRequest<PlaceCandidate[]>(
    `/maps/geocode?query=${encodeURIComponent(trimmedQuery)}`,
    {
      method: "GET",
    },
  );
}
