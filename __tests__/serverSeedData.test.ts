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

  it("keeps the resource profile fields in PostgreSQL seed records", () => {
    const records = createSeedRecords();
    const resourceProfile = records.posts.find((post) => post.id === "job-1");

    expect(resourceProfile).toMatchObject({
      profileMode: "resource",
      availableTasks: ["카페 보조", "농번기 일손", "아이 등하원 동행"],
      preferredPay: "시급 12,000원부터",
    });
  });
});
