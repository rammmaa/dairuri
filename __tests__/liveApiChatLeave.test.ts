import { apiRequest } from "../services/apiClient";
import { leaveChatRoom } from "../services/liveApi";

jest.mock("../services/apiClient", () => ({
  apiRequest: jest.fn(),
}));

describe("live chat room leave API", () => {
  it("deletes the current user's chat room participant record", async () => {
    jest.mocked(apiRequest).mockResolvedValueOnce(undefined);

    await leaveChatRoom("room-1");

    expect(apiRequest).toHaveBeenCalledWith(
      "/chat/rooms/room-1/participants/me",
      { method: "DELETE" },
    );
  });
});
