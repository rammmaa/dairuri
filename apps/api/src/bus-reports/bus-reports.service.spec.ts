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
});
