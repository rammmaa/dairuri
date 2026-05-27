import type { PlaceCandidate } from "../../types/place";

export type NaverMapsRuntimeConfig = {
  ncpKeyId?: string;
  apiKey?: string;
  searchClientId?: string;
  searchClientSecret?: string;
};

export type NaverMapsConfigValidation = {
  ok: boolean;
  errors: string[];
};

type NaverGeocodeAddress = {
  roadAddress?: string;
  jibunAddress?: string;
  englishAddress?: string;
  x?: string;
  y?: string;
};

type NaverGeocodeResponse = {
  addresses?: NaverGeocodeAddress[];
  v2?: {
    addresses?: NaverGeocodeAddress[];
  };
};

type NaverLocalSearchItem = {
  title?: string;
  roadAddress?: string;
  address?: string;
  mapx?: string;
  mapy?: string;
};

type NaverLocalSearchResponse = {
  items?: NaverLocalSearchItem[];
};

export class NaverMapsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NaverMapsConfigError";
  }
}

export function readNaverMapsRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): NaverMapsRuntimeConfig {
  return {
    ncpKeyId: trimOptional(
      env.NAVER_MAP_NCP_KEY_ID ?? env.EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID,
    ),
    apiKey: trimOptional(env.NAVER_MAP_API_KEY),
    searchClientId: trimOptional(
      env.NAVER_SEARCH_CLIENT_ID ?? env.NAVER_LOCAL_SEARCH_CLIENT_ID,
    ),
    searchClientSecret: trimOptional(
      env.NAVER_SEARCH_CLIENT_SECRET ?? env.NAVER_LOCAL_SEARCH_CLIENT_SECRET,
    ),
  };
}

export function validateNaverMapsRuntimeConfig(
  config: NaverMapsRuntimeConfig,
): NaverMapsConfigValidation {
  const errors: string[] = [];

  if (!config.ncpKeyId) {
    errors.push("NAVER_MAP_NCP_KEY_ID is required for Naver Maps REST APIs");
  }

  if (!config.apiKey) {
    errors.push("NAVER_MAP_API_KEY is required for Naver Maps REST APIs");
  }

  if (config.searchClientId && !config.searchClientSecret) {
    errors.push("NAVER_SEARCH_CLIENT_SECRET is required for Naver local search");
  }

  if (!config.searchClientId && config.searchClientSecret) {
    errors.push("NAVER_SEARCH_CLIENT_ID is required for Naver local search");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function buildNaverGeocodeUrl(query: string) {
  const url = new URL(
    "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
  );

  url.searchParams.set("query", query.trim());
  return url;
}

export function buildNaverLocalSearchUrl(query: string) {
  const url = new URL("https://openapi.naver.com/v1/search/local.json");

  url.searchParams.set("query", query.trim());
  url.searchParams.set("display", "5");
  return url;
}

export function mapNaverGeocodeResponse(
  query: string,
  payload: NaverGeocodeResponse,
): PlaceCandidate[] {
  const addresses = payload.addresses ?? payload.v2?.addresses ?? [];
  const trimmedQuery = query.trim();

  return addresses
    .map((address, index): PlaceCandidate | null => {
      const longitude = Number(address.x);
      const latitude = Number(address.y);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        id: makePlaceId(trimmedQuery, index),
        name: trimmedQuery,
        address:
          address.roadAddress ??
          address.jibunAddress ??
          address.englishAddress ??
          "검색된 네이버 지도 위치",
        latitude,
        longitude,
        source: "api",
      };
    })
    .filter((place): place is PlaceCandidate => place !== null);
}

export function mapNaverLocalSearchResponse(
  query: string,
  payload: NaverLocalSearchResponse,
): PlaceCandidate[] {
  const items = payload.items ?? [];
  const trimmedQuery = query.trim();

  return items
    .map((item, index): PlaceCandidate | null => {
      const longitude = parseNaverLocalCoordinate(item.mapx);
      const latitude = parseNaverLocalCoordinate(item.mapy);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const name = stripHtmlTags(item.title) || trimmedQuery;

      return {
        id: makePlaceId(`local-${trimmedQuery}`, index),
        name,
        address: item.roadAddress || item.address || "검색된 네이버 지도 위치",
        latitude,
        longitude,
        source: "api",
      };
    })
    .filter((place): place is PlaceCandidate => place !== null);
}

export async function searchNaverPlaces(
  query: string,
  options: {
    fetchImpl?: typeof fetch;
    config?: NaverMapsRuntimeConfig;
  } = {},
): Promise<PlaceCandidate[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const config = options.config ?? readNaverMapsRuntimeConfig();
  const validation = validateNaverMapsRuntimeConfig(config);
  if (!validation.ok) {
    throw new NaverMapsConfigError(validation.errors.join(", "));
  }

  const hasGeocodeCredentials = Boolean(config.ncpKeyId && config.apiKey);
  const hasLocalSearchCredentials = Boolean(
    config.searchClientId && config.searchClientSecret,
  );

  if (!hasGeocodeCredentials && !hasLocalSearchCredentials) {
    throw new NaverMapsConfigError("Naver Maps credentials are incomplete");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const searches: Array<Promise<PlaceCandidate[]>> = [];

  if (hasGeocodeCredentials && config.ncpKeyId && config.apiKey) {
    searches.push(searchNaverGeocode(trimmedQuery, fetchImpl, config));
  }

  if (
    hasLocalSearchCredentials &&
    config.searchClientId &&
    config.searchClientSecret
  ) {
    searches.push(searchNaverLocal(trimmedQuery, fetchImpl, config));
  }

  const settled = await Promise.allSettled(searches);
  const places = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  if (places.length > 0 || settled.some((result) => result.status === "fulfilled")) {
    return dedupePlaces(places);
  }

  const firstError = settled.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  throw firstError?.reason ?? new Error("Naver place search failed");
}

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function makePlaceId(query: string, index: number) {
  return `naver-${query}-${index}`.replace(/[^a-zA-Z0-9가-힣_-]/g, "-");
}

async function searchNaverGeocode(
  query: string,
  fetchImpl: typeof fetch,
  config: NaverMapsRuntimeConfig,
) {
  const response = await fetchImpl(buildNaverGeocodeUrl(query).toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-NCP-APIGW-API-KEY-ID": config.ncpKeyId ?? "",
      "X-NCP-APIGW-API-KEY": config.apiKey ?? "",
    },
  });

  if (!response.ok) {
    throw new Error(`Naver geocoding request failed: ${response.status}`);
  }

  return mapNaverGeocodeResponse(
    query,
    (await response.json()) as NaverGeocodeResponse,
  );
}

async function searchNaverLocal(
  query: string,
  fetchImpl: typeof fetch,
  config: NaverMapsRuntimeConfig,
) {
  const response = await fetchImpl(buildNaverLocalSearchUrl(query).toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Naver-Client-Id": config.searchClientId ?? "",
      "X-Naver-Client-Secret": config.searchClientSecret ?? "",
    },
  });

  if (!response.ok) {
    throw new Error(`Naver local search request failed: ${response.status}`);
  }

  return mapNaverLocalSearchResponse(
    query,
    (await response.json()) as NaverLocalSearchResponse,
  );
}

function parseNaverLocalCoordinate(value: string | undefined) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return Number.NaN;
  }

  return numeric / 10_000_000;
}

function stripHtmlTags(value: string | undefined) {
  return value?.replace(/<[^>]*>/g, "").trim() ?? "";
}

function dedupePlaces(places: PlaceCandidate[]) {
  const seen = new Set<string>();
  const deduped: PlaceCandidate[] = [];

  for (const place of places) {
    const key = [
      place.name,
      place.address,
      place.latitude.toFixed(6),
      place.longitude.toFixed(6),
    ].join("|");

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(place);
    }
  }

  return deduped;
}
