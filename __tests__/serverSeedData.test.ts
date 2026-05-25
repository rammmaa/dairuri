import { createSeedRecords } from "../server/db/seedData";

describe("server seed data", () => {
  it("maps mock domain records to stable PostgreSQL seed records", () => {
    const records = createSeedRecords();

    expect(records.users.map((user) => user.id)).toEqual(["me", "author-1"]);
    expect(records.posts.map((post) => post.id)).toEqual(["job-1", "carpool-1"]);
    expect(records.applications.map((application) => application.id)).toEqual([
      "application-1",
    ]);
    expect(records.chatRooms.map((room) => room.id)).toEqual(["room-1", "room-2"]);
    expect(records.chatMessages.map((message) => message.id)).toEqual([
      "system-1",
      "message-1",
      "message-2",
    ]);
    expect(records.chatRoomParticipants).toEqual(
      expect.arrayContaining([
        { roomId: "room-1", userId: "me" },
        { roomId: "room-1", userId: "author-1" },
      ]),
    );
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
    expect(records.busStops.map((stop) => stop.id)).toContain("stop-koaru-bluepin");
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
});
