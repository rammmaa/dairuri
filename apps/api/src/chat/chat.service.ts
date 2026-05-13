import { Injectable } from "@nestjs/common";
import type { ChatRoomSummary } from "@dairuri/shared";

@Injectable()
export class ChatService {
  findMyRooms(): ChatRoomSummary[] {
    return [
      {
        id: "chat-room-ride-cafe-weekly",
        listingTitle: "다로리 카페 매주 같이 가실 분 구해요",
        participantLabel: "다로리인 3명",
        lastMessage: "내일 오전 9시에 만나요.",
        updatedAt: "2026-05-13T06:20:00.000Z",
      },
    ];
  }
}
