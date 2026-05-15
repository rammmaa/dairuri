import type { PlaceCandidate } from "../../types/place";

export type NaverMapsRuntimeConfig = {
  ncpKeyId?: string;
  apiKey?: string;
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

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function buildNaverGeocodeUrl(query: string) {
  const url = new URL(
    "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode",
  );

  url.searchParams.set("query", query.trim());
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

  const ncpKeyId = config.ncpKeyId;
  const apiKey = config.apiKey;
  if (!ncpKeyId || !apiKey) {
    throw new NaverMapsConfigError("Naver Maps credentials are incomplete");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(buildNaverGeocodeUrl(trimmedQuery).toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-NCP-APIGW-API-KEY-ID": ncpKeyId,
      "X-NCP-APIGW-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Naver geocoding request failed: ${response.status}`);
  }

  return mapNaverGeocodeResponse(
    trimmedQuery,
    (await response.json()) as NaverGeocodeResponse,
  );
}

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function makePlaceId(query: string, index: number) {
  return `naver-${query}-${index}`.replace(/[^a-zA-Z0-9가-힣_-]/g, "-");
}
