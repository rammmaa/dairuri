import {
  mockApplications,
  mockBusRoutes,
  mockBusRouteStops,
  mockBusSightings,
  mockBusStops,
  mockChatRooms,
  mockPosts,
} from "../data/mockDomain";
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
    });

    await expect(applyToPost("job-1", "지원 자기소개입니다.")).resolves.toMatchObject({
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

describe("mock Happy Bus fixtures", () => {
  it("exposes routes, stops, and historical sightings", () => {
    expect(mockBusRoutes).toHaveLength(3);
    expect(mockBusStops).toHaveLength(8);
    expect(mockBusSightings.length).toBeGreaterThanOrEqual(4);
    expect(mockBusSightings.length).toBeLessThanOrEqual(6);
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
