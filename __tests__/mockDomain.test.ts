import { mockApplications, mockChatRooms, mockPosts } from "../data/mockDomain";
import { applyToPost, getPost, sendMessage } from "../services/mockApi";

describe("mock domain service", () => {
  it("exposes posts, applications, and chat rooms for remaining Darori flows", () => {
    expect(mockPosts.some((post) => post.type === "job")).toBe(true);
    expect(mockPosts.some((post) => post.type === "carpool")).toBe(true);
    expect(mockApplications.length).toBeGreaterThanOrEqual(1);
    expect(mockChatRooms).toHaveLength(2);
  });

  it("fetches posts and appends mock application/messages", async () => {
    await expect(getPost("job-1")).resolves.toMatchObject({
      id: "job-1",
      type: "job",
      profileMode: "resource",
      availableTasks: ["카페 보조", "농번기 일손", "아이 등하원 동행"],
    });

    await expect(applyToPost("job-1", "연락 요청 메시지입니다.")).resolves.toMatchObject({
      postId: "job-1",
      status: "pending",
    });

    await expect(sendMessage("room-1", "확인했습니다.")).resolves.toMatchObject({
      roomId: "room-1",
      senderId: "me",
      type: "text",
    });
  });
});
