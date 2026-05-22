import { mockApplications, mockChatRooms, mockMe, mockMessages, mockPosts } from "../data/mockDomain";
import {
  connectMockDatabase,
  validateDatabaseConsistency,
  type MockDatabase,
} from "../services/mockDb";
import { applyToPost, sendMessage } from "../services/mockApi";

describe("mock database integrity", () => {
  it("connects to the mock database and validates current relationships", () => {
    const database = connectMockDatabase();
    const result = validateDatabaseConsistency(database);

    expect(database.connected).toBe(true);
    expect(result).toEqual({ ok: true, errors: [] });
  });

  it("reports missing relational references", () => {
    const invalidDatabase: MockDatabase = {
      connected: true,
      users: [mockMe],
      posts: [],
      applications: [
        {
          ...mockApplications[0],
          id: "broken-application",
          postId: "missing-post",
        },
      ],
      chatRooms: [
        {
          ...mockChatRooms[0],
          id: "broken-room",
          postId: "missing-post",
        },
      ],
      messages: [
        {
          ...mockMessages[0],
          id: "broken-message",
          roomId: "missing-room",
        },
      ],
      // Bus collections are empty here; the post/application/message errors
      // above are the focus of this test.
      busRoutes: [],
      busStops: [],
      busRouteStops: [],
      busSightings: [],
    };

    const result = validateDatabaseConsistency(invalidDatabase);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "application broken-application references missing post missing-post",
        "chat room broken-room references missing post missing-post",
        "message broken-message references missing room missing-room",
      ]),
    );
  });

  it("rejects service writes that would break database consistency", async () => {
    await expect(applyToPost("missing-post", "지원 자기소개입니다.")).rejects.toThrow(
      "Cannot apply to missing post",
    );
    await expect(sendMessage("missing-room", "안녕하세요")).rejects.toThrow(
      "Cannot send message to missing room",
    );
  });

  it("allows valid service writes and keeps the database valid", async () => {
    await expect(applyToPost("job-1", "지원 자기소개입니다.")).resolves.toMatchObject({
      postId: "job-1",
      status: "pending",
    });
    await expect(sendMessage("room-1", "확인했습니다.")).resolves.toMatchObject({
      roomId: "room-1",
      senderId: "me",
    });

    expect(validateDatabaseConsistency(connectMockDatabase()).ok).toBe(true);
  });
});
