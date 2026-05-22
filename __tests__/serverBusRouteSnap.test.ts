import {
  haversine,
  resolveNearestStop,
  NEAREST_STOP_RADIUS_METERS,
} from "../server/api/busArchive";

describe("haversine", () => {
  it("returns 0 for the same coordinate", () => {
    const point = { latitude: 35.6474, longitude: 128.7338 };
    expect(haversine(point, point)).toBeCloseTo(0, 5);
  });

  it("approximates 111 km per degree of latitude along the equator", () => {
    // 1 degree of latitude is ~111.32 km regardless of longitude.
    const distance = haversine(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    // tolerance: ±500 m on a 111 km baseline
    expect(distance).toBeGreaterThan(110_000);
    expect(distance).toBeLessThan(112_000);
  });

  it("is symmetric in its arguments", () => {
    const a = { latitude: 35.6474, longitude: 128.7338 };
    const b = { latitude: 35.6501, longitude: 128.737 };
    expect(haversine(a, b)).toBeCloseTo(haversine(b, a), 6);
  });
});

describe("resolveNearestStop", () => {
  const cafe = {
    stopId: "stop-darori-cafe",
    latitude: 35.6474,
    longitude: 128.7338,
  };
  const central = {
    stopId: "stop-central",
    latitude: 35.6501,
    longitude: 128.737,
  };
  const farAway = {
    stopId: "stop-far-away",
    latitude: 35.7,
    longitude: 128.9,
  };

  it("returns null for an empty candidate list", () => {
    expect(
      resolveNearestStop(
        { latitude: 35.6474, longitude: 128.7338 },
        [],
      ),
    ).toBeNull();
  });

  it("picks the closest stop within the radius", () => {
    const reporter = { latitude: 35.6477, longitude: 128.734 };
    const snapped = resolveNearestStop(reporter, [cafe, central, farAway]);
    expect(snapped?.stopId).toBe("stop-darori-cafe");
  });

  it("rejects when the closest stop is beyond the default radius", () => {
    // ~1.5 km north of any defined stop in this test set
    const reporter = { latitude: 35.665, longitude: 128.7338 };
    expect(
      resolveNearestStop(reporter, [cafe, central], NEAREST_STOP_RADIUS_METERS),
    ).toBeNull();
  });

  it("honors a custom radius override", () => {
    // Same reporter as the rejection test above; relaxing the radius to 5 km
    // should now match. Distance ranking: central (~1.66 km) < cafe (~1.96 km),
    // so the snap result is central: the nearest *eligible* stop, not the
    // alphabetically first one.
    const reporter = { latitude: 35.665, longitude: 128.7338 };
    const snapped = resolveNearestStop(reporter, [cafe, central], 5_000);
    expect(snapped).not.toBeNull();
    expect(snapped?.stopId).toBe("stop-central");
  });

  it("ignores candidates outside the radius even if they are technically nearest", () => {
    // Only farAway exists, and it is well outside the default radius.
    const reporter = { latitude: 35.6477, longitude: 128.734 };
    expect(
      resolveNearestStop(reporter, [farAway], NEAREST_STOP_RADIUS_METERS),
    ).toBeNull();
  });
});

describe("NEAREST_STOP_RADIUS_METERS export", () => {
  it("falls back to 300 when DARORI_BUS_SNAP_RADIUS_M is unset", () => {
    // The constant is captured at module load; this test merely asserts the
    // shipped default has not been quietly changed without updating the spec.
    expect(NEAREST_STOP_RADIUS_METERS).toBe(300);
  });
});
