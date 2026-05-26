const mockQuery = jest.fn();
const mockMGet = jest.fn();

jest.mock("../server/db/postgres", () => ({
  getPostgresPool: () => ({ query: mockQuery }),
}));

jest.mock("../server/db/redis", () => ({
  getRedisClient: jest.fn(async () => ({ mGet: mockMGet })),
}));

import { listBusStops } from "../server/api/busArchive";

describe("listBusStops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads cached last sighting timestamps with one Redis batch request", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: "stop-a",
          name: "A",
          latitude: "35.1",
          longitude: "128.1",
          last_sighting_at: new Date("2026-05-22T08:00:00.000Z"),
        },
        {
          id: "stop-b",
          name: "B",
          latitude: "35.2",
          longitude: "128.2",
          last_sighting_at: new Date("2026-05-22T09:00:00.000Z"),
        },
      ],
    });
    mockMGet.mockResolvedValue(["2026-05-22T10:00:00.000Z", null]);

    const stops = await listBusStops();

    expect(mockMGet).toHaveBeenCalledTimes(1);
    expect(mockMGet).toHaveBeenCalledWith([
      "darori:bus:last:stop-a",
      "darori:bus:last:stop-b",
    ]);
    expect(stops.map((stop) => stop.lastSightingAt)).toEqual([
      "2026-05-22T10:00:00.000Z",
      "2026-05-22T09:00:00.000Z",
    ]);
  });
});
