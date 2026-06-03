import { resolveInitialAuthenticated } from "../data/appAuthGate";

describe("app auth gate", () => {
  it("requires login when there is no auth session and skip-auth is disabled", () => {
    expect(
      resolveInitialAuthenticated({
        hasAuthSession: false,
        skipAuth: undefined,
      }),
    ).toBe(false);
  });

  it("starts authenticated when an auth session already exists", () => {
    expect(
      resolveInitialAuthenticated({
        hasAuthSession: true,
        skipAuth: undefined,
      }),
    ).toBe(true);
  });

  it("preserves the explicit skip-auth mode for web demos", () => {
    expect(
      resolveInitialAuthenticated({
        hasAuthSession: false,
        skipAuth: "true",
      }),
    ).toBe(true);
  });
});
