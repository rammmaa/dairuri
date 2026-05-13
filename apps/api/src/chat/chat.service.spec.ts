import { describe, expect, it } from "vitest";
import { ChatService } from "./chat.service";

describe("ChatService", () => {
  it("returns match-scoped chat room summaries", () => {
    const service = new ChatService();

    expect(service.findMyRooms()[0]).toMatchObject({
      listingTitle: "다로리 카페 매주 같이 가실 분 구해요",
      participantLabel: "다로리인 3명",
    });
  });
});
