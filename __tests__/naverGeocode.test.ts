import {
  buildNaverGeocodeUrl,
  buildNaverLocalSearchUrl,
  mapNaverGeocodeResponse,
  mapNaverLocalSearchResponse,
  readNaverMapsRuntimeConfig,
  searchNaverPlaces,
  validateNaverMapsRuntimeConfig,
} from "../server/maps/naverGeocode";

describe("Naver geocoding integration", () => {
  it("reads and validates server-side Naver map credentials", () => {
    const config = readNaverMapsRuntimeConfig({
      NAVER_MAP_NCP_KEY_ID: "client-id",
      NAVER_MAP_API_KEY: "secret-key",
    });

    expect(config).toEqual({
      ncpKeyId: "client-id",
      apiKey: "secret-key",
      searchClientId: undefined,
      searchClientSecret: undefined,
    });
    expect(validateNaverMapsRuntimeConfig(config)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("builds the official Naver geocoding endpoint URL", () => {
    expect(buildNaverGeocodeUrl("청도역").toString()).toBe(
      "https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=%EC%B2%AD%EB%8F%84%EC%97%AD",
    );
  });

  it("maps Naver geocoding addresses into app place candidates", () => {
    const places = mapNaverGeocodeResponse("청도역", {
      addresses: [
        {
          roadAddress: "경상북도 청도군 청도읍 청화로 214",
          jibunAddress: "경상북도 청도군 청도읍 고수리 969-7",
          x: "128.736146",
          y: "35.647383",
        },
      ],
    });

    expect(places).toEqual([
      {
        id: "naver-청도역-0",
        name: "청도역",
        address: "경상북도 청도군 청도읍 청화로 214",
        latitude: 35.647383,
        longitude: 128.736146,
        source: "api",
      },
    ]);
  });

  it("builds the official Naver local search endpoint URL", () => {
    expect(buildNaverLocalSearchUrl("청도역").toString()).toBe(
      "https://openapi.naver.com/v1/search/local.json?query=%EC%B2%AD%EB%8F%84%EC%97%AD&display=5",
    );
  });

  it("maps Naver local search places into app place candidates", () => {
    const places = mapNaverLocalSearchResponse("청도역", {
      items: [
        {
          title: "<b>청도역</b>",
          roadAddress: "경북 청도군 청도읍 청화로 214",
          address: "경북 청도군 청도읍 고수리 969-7",
          mapx: "1287361460",
          mapy: "356473830",
        },
      ],
    });

    expect(places).toEqual([
      {
        id: "naver-local-청도역-0",
        name: "청도역",
        address: "경북 청도군 청도읍 청화로 214",
        latitude: 35.647383,
        longitude: 128.736146,
        source: "api",
      },
    ]);
  });

  it("uses local search results when geocoding returns no address candidates", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ addresses: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              title: "<b>청도역</b>",
              roadAddress: "경북 청도군 청도읍 청화로 214",
              address: "경북 청도군 청도읍 고수리 969-7",
              mapx: "1287361460",
              mapy: "356473830",
            },
          ],
        }),
      });

    await expect(
      searchNaverPlaces("청도역", {
        fetchImpl: fetchImpl as never,
        config: {
          ncpKeyId: "map-client-id",
          apiKey: "map-secret",
          searchClientId: "search-client-id",
          searchClientSecret: "search-secret",
        },
      }),
    ).resolves.toMatchObject([
      {
        name: "청도역",
        latitude: 35.647383,
        longitude: 128.736146,
      },
    ]);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({
        "X-Naver-Client-Id": "search-client-id",
        "X-Naver-Client-Secret": "search-secret",
      }),
    });
  });
});
