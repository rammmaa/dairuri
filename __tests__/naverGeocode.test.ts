import {
  buildNaverGeocodeUrl,
  mapNaverGeocodeResponse,
  readNaverMapsRuntimeConfig,
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
});
