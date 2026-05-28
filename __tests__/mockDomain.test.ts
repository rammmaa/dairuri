import {
  mockApplications,
  mockBusRoutes,
  mockBusRouteStops,
  mockBusSightings,
  mockBusStops,
  mockChatRooms,
  mockPosts,
} from "../data/mockDomain";
import {
  applyToPost,
  getPost,
  sendImageMessage,
  sendMessage,
  submitMannerRating,
} from "../services/mockApi";

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

    await expect(
      sendImageMessage("room-1", "data:image/jpeg;base64,abc", "사진 확인해주세요."),
    ).resolves.toMatchObject({
      roomId: "room-1",
      senderId: "me",
      type: "image",
      imageUrl: "data:image/jpeg;base64,abc",
    });
  });

  it("stores manner ratings and applies a bounded temperature increase", async () => {
    const rating = await submitMannerRating("room-1", [
      "시간 약속을 잘 지켰어요",
      "친절하게 소통했어요",
    ]);

    expect(rating).toMatchObject({
      targetUserId: "author-1",
      temperature: 80.6,
    });
  });
});

describe("mock Happy Bus fixtures", () => {
  it("exposes six Happy Bus routes, six stops, and historical sightings", () => {
    expect(mockBusRoutes).toHaveLength(6);
    expect(mockBusStops).toHaveLength(6);
    expect(mockBusSightings.length).toBeGreaterThanOrEqual(3);
    expect(mockBusSightings.length).toBeLessThanOrEqual(6);
  });

  it("uses the H1 through H6 codes for the Happy Bus routes", () => {
    expect(mockBusRoutes.map((route) => route.code)).toEqual([
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
    ]);
  });

  it("assigns a single mint color to every Happy Bus route", () => {
    const distinctColors = new Set(mockBusRoutes.map((route) => route.color));
    expect(distinctColors.size).toBe(1);
  });

  it("uses the six stop names sourced from the Figma frame", () => {
    expect(mockBusStops.map((stop) => stop.name)).toEqual([
      "청도 코아루블루핀",
      "청도군청",
      "청도 버스 터미널",
      "성조 아파트 앞",
      "부민 아파트",
      "어린이집",
    ]);
  });

  it("assigns a unique sequence within each route", () => {
    const seen = new Map<string, Set<number>>();
    for (const link of mockBusRouteStops) {
      const slots = seen.get(link.routeId) ?? new Set<number>();
      expect(slots.has(link.sequence)).toBe(false);
      slots.add(link.sequence);
      seen.set(link.routeId, slots);
    }
  });

  it("only references known routes and stops from sightings and links", () => {
    const routeIds = new Set(mockBusRoutes.map((route) => route.id));
    const stopIds = new Set(mockBusStops.map((stop) => stop.id));

    for (const link of mockBusRouteStops) {
      expect(routeIds.has(link.routeId)).toBe(true);
      expect(stopIds.has(link.stopId)).toBe(true);
    }

    for (const sighting of mockBusSightings) {
      expect(routeIds.has(sighting.routeId)).toBe(true);
      expect(stopIds.has(sighting.stopId)).toBe(true);
    }
  });

  it("only records sightings at stops that actually belong to the route", () => {
    const routeStopPairs = new Set(
      mockBusRouteStops.map((link) => `${link.routeId}::${link.stopId}`),
    );

    for (const sighting of mockBusSightings) {
      expect(routeStopPairs.has(`${sighting.routeId}::${sighting.stopId}`)).toBe(
        true,
      );
    }
  });
});
