import { createSeedRecords } from "../server/db/seedData";

describe("server seed data", () => {
  it("maps mock domain records to stable PostgreSQL seed records", () => {
    const records = createSeedRecords();

    expect(records.users.map((user) => user.id)).toEqual(["me", "author-1"]);
    expect(records.posts).toEqual([]);
    expect(records.postLikes).toEqual([]);
    expect(records.applications).toEqual([]);
    expect(records.chatRooms).toEqual([]);
    expect(records.chatMessages).toEqual([]);
    expect(records.chatRoomParticipants).toEqual([]);
  });

  it("keeps only the APK login seed user credentialed", () => {
    const records = createSeedRecords();

    expect(records.users.find((user) => user.id === "me")).toMatchObject({
      loginId: "rammma",
      phone: "010-0000-0000",
      email: "test@example.com",
      licenseVerified: true,
      insuranceVerified: true,
      passwordHash: expect.stringMatching(/^scrypt:[^:]+:[0-9a-f]+$/),
    });
    expect(records.users.find((user) => user.id === "author-1")?.passwordHash).toBeNull();
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
    expect(records.busStops).toHaveLength(6);
    expect(records.busRouteStops.length).toBeGreaterThanOrEqual(18);
    expect(records.busSightings.map((sighting) => sighting.id)).toEqual(
      expect.arrayContaining(["sighting-1", "sighting-2"]),
    );
    for (const sighting of records.busSightings) {
      // seed never carries the read-time reporter_label
      expect(sighting).not.toHaveProperty("reporterLabel");
      expect(typeof sighting.reporterId === "string" || sighting.reporterId === null).toBe(
        true,
      );
    }
  });

  it("does not seed placeholder recruitment records", () => {
    const records = createSeedRecords();

    expect(records.posts).toHaveLength(0);
    expect(records.applications).toHaveLength(0);
    expect(records.chatRooms).toHaveLength(0);
  });
});
