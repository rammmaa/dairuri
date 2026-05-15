describe("place search service", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("requests Darori API geocoding instead of calling third-party map APIs from the app", async () => {
    process.env.EXPO_PUBLIC_DARORI_API_BASE_URL = "http://localhost:8787";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "naver-청도역-0",
          name: "청도역",
          address: "경상북도 청도군 청도읍 청화로 214",
          latitude: 35.647383,
          longitude: 128.736146,
          source: "api",
        },
      ],
    });
    global.fetch = fetchMock as never;
    const { searchPlaceCandidates } = require("../services/places");

    await expect(searchPlaceCandidates("청도역")).resolves.toEqual([
      {
        id: "naver-청도역-0",
        name: "청도역",
        address: "경상북도 청도군 청도읍 청화로 214",
        latitude: 35.647383,
        longitude: 128.736146,
        source: "api",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8787/maps/geocode?query=%EC%B2%AD%EB%8F%84%EC%97%AD",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });
});
