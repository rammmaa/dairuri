import { createBusReport, fetchJobs, fetchRecentBusReports, fetchRides } from "./dairuriApi";

describe("dairuriApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads ride and job listings from the backend", async () => {
    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/rides")) {
        return Promise.resolve(response([{ id: "ride-1", type: "ride" }]));
      }

      if (url.endsWith("/jobs")) {
        return Promise.resolve(response([{ id: "job-1", type: "job" }]));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(fetchRides()).resolves.toEqual([{ id: "ride-1", type: "ride" }]);
    await expect(fetchJobs()).resolves.toEqual([{ id: "job-1", type: "job" }]);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/rides");
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/jobs");
  });

  it("loads recent bus reports and posts new bus sightings", async () => {
    jest.spyOn(global, "fetch").mockImplementation((input, init) => {
      const url = String(input);

      if (url.endsWith("/bus-reports/recent")) {
        return Promise.resolve(response([{ id: "bus-report-1" }]));
      }

      if (url.endsWith("/bus-reports")) {
        return Promise.resolve(response({ id: "bus-report-created" }));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(fetchRecentBusReports()).resolves.toEqual([{ id: "bus-report-1" }]);
    await expect(
      createBusReport({
        routeNumber: "3",
        placeName: "다로리 카페",
        lat: 35.7001,
        lng: 128.7342,
      }),
    ).resolves.toEqual({ id: "bus-report-created" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/bus-reports",
      {
        body: JSON.stringify({
          routeNumber: "3",
          placeName: "다로리 카페",
          lat: 35.7001,
          lng: 128.7342,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
  });
});

function response(body: unknown): Response {
  return {
    ok: true,
    json: () => Promise.resolve(body),
  } as Response;
}
