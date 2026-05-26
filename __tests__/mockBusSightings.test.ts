import { mockBusRoutes, mockBusStops } from "../data/mockDomain";
import {
  getBusRoutes,
  getBusStops,
  getStopSightings,
  recordBusSighting,
} from "../services/mockApi";
import { mockReporterLabel } from "../services/busArchiveCore";
import { resetMockDatabase } from "../services/mockDb";

const NEAREST_KOARU_COORDS = { latitude: 35.6474, longitude: 128.7338 };

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
    const koaru = stops.find((stop) => stop.id === "stop-koaru-bluepin");
    expect(koaru?.lastSightingAt).toBe("2026-05-22T08:30:00.000Z");

    const stopWithoutSighting = stops.find(
      (stop) => stop.id === "stop-bumin-apt",
    );
    expect(stopWithoutSighting?.lastSightingAt).toBeUndefined();
  });

  it("lists existing sightings for a stop newest first", async () => {
    const sightings = await getStopSightings("stop-koaru-bluepin");
    expect(sightings.length).toBeGreaterThanOrEqual(1);
    expect(sightings[0]?.stopId).toBe("stop-koaru-bluepin");
    expect(sightings[0]?.reporterLabel).toMatch(/^[0-9a-f]{6}$/);
  });

  it("records a new sighting and surfaces it on the stop list and stop sightings", async () => {
    const koaru = mockBusStops.find((stop) => stop.id === "stop-koaru-bluepin");
    if (!koaru) {
      throw new Error("seed stop missing");
    }

    const recorded = await recordBusSighting({
      routeId: "route-happy-1",
      latitude: koaru.latitude,
      longitude: koaru.longitude,
    });

    expect(recorded.stopId).toBe("stop-koaru-bluepin");
    expect(recorded.routeId).toBe("route-happy-1");
    expect(recorded.reporterLabel).toMatch(/^[0-9a-f]{6}$/);
    // mock mode pins the reporter to mockMe (id = "me"), so the label must
    // match what mockReporterLabel("me") returns.
    expect(recorded.reporterLabel).toBe(mockReporterLabel("me"));

    const stops = await getBusStops();
    const updated = stops.find((stop) => stop.id === "stop-koaru-bluepin");
    expect(updated?.lastSightingAt).toBe(recorded.createdAt);

    const stopSightings = await getStopSightings("stop-koaru-bluepin");
    expect(stopSightings[0]?.id).toBe(recorded.id);
  });

  it("snaps to the nearest stop on the requested route even when the reporter is slightly off", async () => {
    // ~70 m east of the Cheongdo bus terminal (35.6501, 128.7370). Still on
    // H1, which visits the terminal.
    const recorded = await recordBusSighting({
      routeId: "route-happy-1",
      latitude: 35.65015,
      longitude: 128.7378,
    });
    expect(recorded.stopId).toBe("stop-cheongdo-terminal");
  });

  it("records the selected stop when the user manually overrides the nearest stop", async () => {
    const recorded = await recordBusSighting({
      routeId: "route-happy-6",
      stopId: "stop-cheongdo-terminal",
      latitude: NEAREST_KOARU_COORDS.latitude,
      longitude: NEAREST_KOARU_COORDS.longitude,
    });

    expect(recorded.stopId).toBe("stop-cheongdo-terminal");

    const terminalSightings = await getStopSightings("stop-cheongdo-terminal");
    expect(terminalSightings[0]?.id).toBe(recorded.id);
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
