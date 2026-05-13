import { describe, expect, it } from "vitest";
import { BusReportsService } from "./bus-reports.service";

describe("BusReportsService", () => {
  it("stores a resident bus sighting with current place and route number", () => {
    const service = new BusReportsService();

    const report = service.create({
      routeNumber: "3",
      placeName: "다로리 카페",
      lat: 35.7001,
      lng: 128.7342,
    });

    expect(report).toMatchObject({
      routeNumber: "3",
      placeName: "다로리 카페",
      location: { lat: 35.7001, lng: 128.7342 },
    });
    expect(service.findRecent()).toContainEqual(report);
  });

  it("filters recent reports by route number", () => {
    const service = new BusReportsService();

    service.create({
      routeNumber: "3",
      placeName: "다로리 카페",
      lat: 35.7001,
      lng: 128.7342,
    });
    service.create({
      routeNumber: "4",
      placeName: "청도역",
      lat: 35.699,
      lng: 128.731,
    });

    expect(service.findRecent("3")).toEqual([
      expect.objectContaining({
        routeNumber: "3",
        placeName: "다로리 카페",
      }),
    ]);
  });
});
