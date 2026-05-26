import {
  BusSightingInputError,
  normalizeRecordSightingInput,
} from "../server/api/busArchive";

describe("normalizeRecordSightingInput", () => {
  const validInput = {
    routeId: "route-happy-1",
    latitude: 35.6474,
    longitude: 128.7338,
  };

  it("returns the trimmed input when fully valid", () => {
    expect(
      normalizeRecordSightingInput({
        routeId: "  route-happy-1  ",
        stopId: "  stop-koaru-bluepin  ",
        latitude: 35.6474,
        longitude: 128.7338,
      }),
    ).toEqual({
      routeId: "route-happy-1",
      stopId: "stop-koaru-bluepin",
      latitude: 35.6474,
      longitude: 128.7338,
    });
  });

  it("rejects a missing routeId", () => {
    expect(() => normalizeRecordSightingInput({ ...validInput, routeId: "" })).toThrow(
      BusSightingInputError,
    );
    expect(() => normalizeRecordSightingInput({ ...validInput, routeId: "   " })).toThrow(
      "routeId is required",
    );
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, routeId: undefined }),
    ).toThrow("routeId is required");
  });

  it("rejects a non-finite latitude", () => {
    expect(() =>
      normalizeRecordSightingInput({
        ...validInput,
        latitude: Number.NaN,
      }),
    ).toThrow("latitude must be a finite number");
    expect(() =>
      normalizeRecordSightingInput({
        ...validInput,
        latitude: Number.POSITIVE_INFINITY,
      }),
    ).toThrow("latitude must be a finite number");
    expect(() =>
      normalizeRecordSightingInput({
        ...validInput,
        latitude: undefined,
      }),
    ).toThrow("latitude must be a finite number");
  });

  it("rejects a blank manual stopId", () => {
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, stopId: "   " }),
    ).toThrow("stopId is required");
  });

  it("rejects a latitude outside [-90, 90]", () => {
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, latitude: 91 }),
    ).toThrow("latitude out of range");
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, latitude: -90.0001 }),
    ).toThrow("latitude out of range");
  });

  it("rejects a non-finite longitude", () => {
    expect(() =>
      normalizeRecordSightingInput({
        ...validInput,
        longitude: Number.NaN,
      }),
    ).toThrow("longitude must be a finite number");
  });

  it("rejects a longitude outside [-180, 180]", () => {
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, longitude: 181 }),
    ).toThrow("longitude out of range");
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, longitude: -180.0001 }),
    ).toThrow("longitude out of range");
  });

  it("accepts the exact edges of latitude and longitude", () => {
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, latitude: 90, longitude: 180 }),
    ).not.toThrow();
    expect(() =>
      normalizeRecordSightingInput({ ...validInput, latitude: -90, longitude: -180 }),
    ).not.toThrow();
  });
});
