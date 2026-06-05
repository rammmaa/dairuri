import { mockBusRoutes, mockBusStops } from "../data/mockDomain";
import {
  getBusRoutes,
  getBusStops,
  getStopSightings,
  recordBusSighting,
} from "../services/mockApi";
import { mockReporterLabel } from "../services/busArchiveCore";
import { resetMockDatabase } from "../services/mockDb";

const NEAREST_TERMINAL_COORDS = { latitude: 35.6413, longitude: 128.7464 };

describe("mock Happy Bus archive API", () => {
  // The mock connection is a module-level singleton that accumulates writes
  // across cases. Reset it before each test so order-of-execution does not
  // change what "the seeded sighting at cafe" means.
  beforeEach(() => {
    resetMockDatabase();
  });

  it("returns the seeded routes in stable order", async () => {
    const routes = await getBusRoutes();
    expect(routes.map((route) => route.code)).toEqual(
      mockBusRoutes.map((route) => route.code),
    );
  });

  it("derives lastSightingAt on each stop from the most recent sighting", async () => {
    const stops = await getBusStops();
    const terminal = stops.find((stop) => stop.id === "stop-cheongdo-public-terminal");
    expect(terminal?.lastSightingAt).toBe("2026-05-22T08:30:00.000Z");

    const stopWithoutSighting = stops.find(
      (stop) => stop.id === "stop-gwitturami-boiler",
    );
    expect(stopWithoutSighting?.lastSightingAt).toBeUndefined();
  });

  it("lists existing sightings for a stop newest first", async () => {
    const sightings = await getStopSightings("stop-cheongdo-public-terminal");
    expect(sightings.length).toBeGreaterThanOrEqual(1);
    expect(sightings[0]?.stopId).toBe("stop-cheongdo-public-terminal");
    expect(sightings[0]?.reporterLabel).toMatch(/^[0-9a-f]{6}$/);
  });

  it("records a new sighting and surfaces it on the stop list and stop sightings", async () => {
    const terminal = mockBusStops.find(
      (stop) => stop.id === "stop-cheongdo-public-terminal",
    );
    if (!terminal) {
      throw new Error("seed stop missing");
    }

    const recorded = await recordBusSighting({
      routeId: "route-happy-1",
      latitude: terminal.latitude,
      longitude: terminal.longitude,
    });

    expect(recorded.stopId).toBe("stop-cheongdo-public-terminal");
    expect(recorded.routeId).toBe("route-happy-1");
    expect(recorded.reporterLabel).toMatch(/^[0-9a-f]{6}$/);
    // mock mode pins the reporter to mockMe (id = "me"), so the label must
    // match what mockReporterLabel("me") returns.
    expect(recorded.reporterLabel).toBe(mockReporterLabel("me"));

    const stops = await getBusStops();
    const updated = stops.find((stop) => stop.id === "stop-cheongdo-public-terminal");
    expect(updated?.lastSightingAt).toBe(recorded.createdAt);

    const stopSightings = await getStopSightings("stop-cheongdo-public-terminal");
    expect(stopSightings[0]?.id).toBe(recorded.id);
  });

  it("snaps to the nearest stop on the requested route even when the reporter is slightly off", async () => {
    // ~30 m from 구미리 (35.6435, 128.7510), nearer than the terminal or
    // 아랫구미. Still on H1, which visits 구미리.
    const recorded = await recordBusSighting({
      routeId: "route-happy-1",
      latitude: 35.6437,
      longitude: 128.7513,
    });
    expect(recorded.stopId).toBe("stop-gumiri");
  });

  it("records the selected stop when the user manually overrides the nearest stop", async () => {
    // 안송읍 is on H6 but far from the terminal; the manual override records it
    // anyway instead of snapping to the nearest stop.
    const recorded = await recordBusSighting({
      routeId: "route-happy-6",
      stopId: "stop-ansongeup",
      latitude: NEAREST_TERMINAL_COORDS.latitude,
      longitude: NEAREST_TERMINAL_COORDS.longitude,
    });

    expect(recorded.stopId).toBe("stop-ansongeup");

    const ansongSightings = await getStopSightings("stop-ansongeup");
    expect(ansongSightings[0]?.id).toBe(recorded.id);
  });

  it("rejects when the reporter is too far from every stop on the route", async () => {
    await expect(
      recordBusSighting({
        routeId: "route-happy-1",
        latitude: 35.8,
        longitude: 128.9,
      }),
    ).rejects.toThrow("no nearby stop on route");
  });

  it("rejects when the route does not exist", async () => {
    await expect(
      recordBusSighting({
        routeId: "route-unknown",
        latitude: 35.6474,
        longitude: 128.7338,
      }),
    ).rejects.toThrow("route not found");
  });

  it("rejects on invalid input before touching the database", async () => {
    await expect(
      recordBusSighting({
        routeId: "",
        latitude: 35.6474,
        longitude: 128.7338,
      }),
    ).rejects.toThrow("routeId is required");
  });
});
