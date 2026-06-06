import { createSeedRecords } from "../server/db/seedData";

describe("server seed data", () => {
  it("maps mock domain records to stable PostgreSQL seed records", () => {
    const records = createSeedRecords();

    expect(records.users).toEqual([]);
    expect(records.vehicles).toEqual([]);
    expect(records.posts).toEqual([]);
    expect(records.postLikes).toEqual([]);
    expect(records.applications).toEqual([]);
    expect(records.chatRooms).toEqual([]);
    expect(records.chatMessages).toEqual([]);
    expect(records.chatRoomParticipants).toEqual([]);
  });

  it("does not seed APK login credentials", () => {
    const records = createSeedRecords();

    expect(records.users.some((user) => user.passwordHash)).toBe(false);
  });

  it("includes Happy Bus seed records", () => {
    const records = createSeedRecords();

    expect(records.busRoutes.map((route) => route.id)).toEqual([
      "route-happy-1",
      "route-happy-2",
      "route-happy-3",
      "route-happy-4",
      "route-happy-5",
      "route-happy-6",
    ]);
    expect(records.busStops.map((stop) => stop.id)).toContain("stop-cheongdo-public-terminal");
    expect(records.busStops).toHaveLength(39);
    expect(records.busRouteStops.length).toBeGreaterThanOrEqual(18);
    expect(records.busSightings.map((sighting) => sighting.id)).toEqual(
      expect.arrayContaining(["sighting-1", "sighting-2"]),
    );
    for (const sighting of records.busSightings) {
      // seed never carries the read-time reporter_label
      expect(sighting).not.toHaveProperty("reporterLabel");
      expect(sighting.reporterId).toBeNull();
    }
  });

  it("does not seed placeholder recruitment records", () => {
    const records = createSeedRecords();

    expect(records.posts).toHaveLength(0);
    expect(records.applications).toHaveLength(0);
    expect(records.chatRooms).toHaveLength(0);
  });
});
