import { getChatRooms, leaveChatRoom } from "../services/mockApi";
import { connectMockDatabase, resetMockDatabase } from "../services/mockDb";

describe("mock chat room leave API", () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  it("removes the current user from the room and hides it from their room list", async () => {
    await leaveChatRoom("room-1");

    expect(connectMockDatabase().chatRooms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "room-1",
          participants: expect.not.arrayContaining([
            expect.objectContaining({ id: "me" }),
          ]),
        }),
      ]),
    );
    await expect(getChatRooms()).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "room-1" })]),
    );
  });
});
