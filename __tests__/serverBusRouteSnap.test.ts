import {
  haversine,
  inferRouteAndStop,
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
    stopId: "stop-koaru-bluepin",
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
    expect(snapped?.stopId).toBe("stop-koaru-bluepin");
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

describe("inferRouteAndStop", () => {
  const koaru = {
    id: "stop-koaru-bluepin",
    latitude: 35.6474,
    longitude: 128.7338,
  };
  const office = {
    id: "stop-cheongdo-office",
    latitude: 35.6492,
    longitude: 128.7355,
  };
  const terminal = {
    id: "stop-cheongdo-terminal",
    latitude: 35.6501,
    longitude: 128.7370,
  };
  const farAway = {
    id: "stop-far-away",
    latitude: 35.7,
    longitude: 128.9,
  };

  const h1 = { id: "route-happy-1", code: "H1" };
  const h2 = { id: "route-happy-2", code: "H2" };
  const h6 = { id: "route-happy-6", code: "H6" };

  it("returns null when any input is empty", () => {
    const reporter = { latitude: 35.6474, longitude: 128.7338 };
    expect(inferRouteAndStop(reporter, [], [], [koaru])).toBeNull();
    expect(inferRouteAndStop(reporter, [h1], [], [koaru])).toBeNull();
    expect(
      inferRouteAndStop(
        reporter,
        [h1],
        [{ routeId: "route-happy-1", stopId: "stop-koaru-bluepin" }],
        [],
      ),
    ).toBeNull();
  });

  it("returns null when no stop is within the radius", () => {
    const reporter = { latitude: 35.6474, longitude: 128.7338 };
    expect(
      inferRouteAndStop(
        reporter,
        [h1],
        [{ routeId: "route-happy-1", stopId: "stop-far-away" }],
        [farAway],
      ),
    ).toBeNull();
  });

  it("picks the only route in range when there is no choice", () => {
    const reporter = { latitude: 35.6475, longitude: 128.7339 };
    const result = inferRouteAndStop(
      reporter,
      [h1, h2],
      [{ routeId: "route-happy-1", stopId: "stop-koaru-bluepin" }],
      [koaru, office],
    );
    expect(result?.route.id).toBe("route-happy-1");
    expect(result?.stop.id).toBe("stop-koaru-bluepin");
  });

  it("prefers the strictly closer stop even when both are in range", () => {
    // Reporter near koaru-bluepin (~35.6474), so koaru wins over office.
    const reporter = { latitude: 35.6475, longitude: 128.7339 };
    const result = inferRouteAndStop(
      reporter,
      [h1, h2],
      [
        { routeId: "route-happy-1", stopId: "stop-koaru-bluepin" },
        { routeId: "route-happy-2", stopId: "stop-cheongdo-office" },
      ],
      [koaru, office],
    );
    expect(result?.stop.id).toBe("stop-koaru-bluepin");
    expect(result?.route.id).toBe("route-happy-1");
  });

  it("breaks junction-stop ties by ascending route.code", () => {
    // Reporter sits exactly at koaru. Both H1 and H6 stop here; H1 < H6, so
    // the inference returns H1.
    const reporter = { latitude: koaru.latitude, longitude: koaru.longitude };
    const result = inferRouteAndStop(
      reporter,
      [h6, h1],
      [
        { routeId: "route-happy-6", stopId: "stop-koaru-bluepin" },
        { routeId: "route-happy-1", stopId: "stop-koaru-bluepin" },
      ],
      [koaru],
    );
    expect(result?.route.id).toBe("route-happy-1");
    expect(result?.stop.id).toBe("stop-koaru-bluepin");
  });

  it("honors a custom radius override", () => {
    // ~1.66 km north of terminal; default 300 m rejects everything, but
    // relaxing to 5 km picks the closer stop (terminal beats office).
    const reporter = { latitude: 35.665, longitude: 128.7370 };
    expect(
      inferRouteAndStop(
        reporter,
        [h1, h2],
        [
          { routeId: "route-happy-1", stopId: "stop-cheongdo-terminal" },
          { routeId: "route-happy-2", stopId: "stop-cheongdo-office" },
        ],
        [office, terminal],
      ),
    ).toBeNull();

    const relaxed = inferRouteAndStop(
      reporter,
      [h1, h2],
      [
        { routeId: "route-happy-1", stopId: "stop-cheongdo-terminal" },
        { routeId: "route-happy-2", stopId: "stop-cheongdo-office" },
      ],
      [office, terminal],
      5_000,
    );
    expect(relaxed?.stop.id).toBe("stop-cheongdo-terminal");
    expect(relaxed?.route.id).toBe("route-happy-1");
  });

  it("ignores links whose route or stop is missing from the catalogs", () => {
    const reporter = { latitude: 35.6475, longitude: 128.7339 };
    const result = inferRouteAndStop(
      reporter,
      [h1],
      [
        { routeId: "route-missing", stopId: "stop-koaru-bluepin" },
        { routeId: "route-happy-1", stopId: "stop-missing" },
        { routeId: "route-happy-1", stopId: "stop-koaru-bluepin" },
      ],
      [koaru],
    );
    expect(result?.route.id).toBe("route-happy-1");
    expect(result?.stop.id).toBe("stop-koaru-bluepin");
  });
});
