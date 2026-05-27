import { resolveApiMode } from "../services/api";

describe("api mode resolution", () => {
  it("uses live API by default outside tests", () => {
    expect(
      resolveApiMode({
        NODE_ENV: "production",
        EXPO_PUBLIC_DARORI_API_BASE_URL: undefined,
        EXPO_PUBLIC_DARORI_USE_MOCK_API: undefined,
      }),
    ).toBe("live");
  });

  it("keeps mock API available for tests or explicit local opt-in", () => {
    expect(resolveApiMode({ NODE_ENV: "test" })).toBe("mock");
    expect(
      resolveApiMode({
        NODE_ENV: "development",
        EXPO_PUBLIC_DARORI_USE_MOCK_API: "true",
      }),
    ).toBe("mock");
  });

  it("rejects mock API mode in production", () => {
    expect(() =>
      resolveApiMode({
        NODE_ENV: "production",
        EXPO_PUBLIC_DARORI_USE_MOCK_API: "true",
      }),
    ).toThrow("mock API mode is not allowed in production builds");
  });
});
