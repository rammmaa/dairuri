import {
  mockApplications,
  mockAuthor,
  mockBusRoutes,
  mockBusRouteStops,
  mockBusSightings,
  mockBusStops,
  mockChatRooms,
  mockMe,
  mockMessages,
  mockPosts,
  type MockBusRouteStop,
  type MockBusSightingRaw,
} from "../data/mockDomain";
import type {
  Application,
  BusRoute,
  BusStop,
  ChatMessage,
  ChatRoom,
  Post,
  UserProfile,
} from "../types/domain";

export type MockDatabase = {
  connected: true;
  users: UserProfile[];
  posts: Post[];
  applications: Application[];
  chatRooms: ChatRoom[];
  messages: ChatMessage[];
  busRoutes: BusRoute[];
  busStops: BusStop[];
  busRouteStops: MockBusRouteStop[];
  busSightings: MockBusSightingRaw[];
};

export type DatabaseValidationResult = {
  ok: boolean;
  errors: string[];
};

let connection: MockDatabase | null = null;

export function connectMockDatabase(): MockDatabase {
  if (!connection) {
    connection = {
      connected: true,
      users: [mockMe, mockAuthor],
      posts: mockPosts,
      applications: mockApplications,
      chatRooms: mockChatRooms,
      messages: mockMessages,
      // Bus collections are spread into mutable arrays so mockApi can append
      // new sightings without mutating the shared mockDomain fixtures (the
      // same fixtures are also used by serverSeedData and integrity tests).
      busRoutes: [...mockBusRoutes],
      busStops: [...mockBusStops],
      busRouteStops: [...mockBusRouteStops],
      busSightings: [...mockBusSightings],
    };
  }

  assertDatabaseConsistency(connection);
  return connection;
}

/**
 * Drop the module-level mock connection so the next `connectMockDatabase()`
 * call re-spreads the fixtures fresh. Intended for tests that need a clean
 * slate between cases; most production code paths should not call this.
 */
export function resetMockDatabase(): void {
  connection = null;
}

export function validateDatabaseConsistency(
  database: MockDatabase,
): DatabaseValidationResult {
  const errors: string[] = [];
  const userIds = new Set(database.users.map((user) => user.id));
  const postIds = new Set<string>();
  const applicationIds = new Set<string>();
  const chatRoomIds = new Set<string>();

  for (const post of database.posts) {
    if (postIds.has(post.id)) {
      errors.push(`duplicate post id: ${post.id}`);
    }
    postIds.add(post.id);

    if (!userIds.has(post.author.id)) {
      errors.push(`post ${post.id} references missing author ${post.author.id}`);
    }

    if (post.type === "job") {
      if (!post.placeName.trim()) {
        errors.push(`job post ${post.id} is missing placeName`);
      }
      if (post.wageAmount <= 0) {
        errors.push(`job post ${post.id} has invalid wageAmount`);
      }
    } else {
      if (!post.departure.trim() || !post.destination.trim()) {
        errors.push(`carpool post ${post.id} is missing route places`);
      }
    }
  }

  for (const application of database.applications) {
    if (applicationIds.has(application.id)) {
      errors.push(`duplicate application id: ${application.id}`);
    }
    applicationIds.add(application.id);

    if (!postIds.has(application.postId)) {
      errors.push(
        `application ${application.id} references missing post ${application.postId}`,
      );
    }

    if (!userIds.has(application.applicant.id)) {
      errors.push(
        `application ${application.id} references missing applicant ${application.applicant.id}`,
      );
    }

    if (!application.intro.trim()) {
      errors.push(`application ${application.id} is missing intro`);
    }
  }

  for (const room of database.chatRooms) {
    if (chatRoomIds.has(room.id)) {
      errors.push(`duplicate chat room id: ${room.id}`);
    }
    chatRoomIds.add(room.id);

    if (room.postId && !postIds.has(room.postId)) {
      errors.push(`chat room ${room.id} references missing post ${room.postId}`);
    }

    for (const participant of room.participants) {
      if (!userIds.has(participant.id)) {
        errors.push(
          `chat room ${room.id} references missing participant ${participant.id}`,
        );
      }
    }
  }

  for (const message of database.messages) {
    if (!chatRoomIds.has(message.roomId)) {
      errors.push(`message ${message.id} references missing room ${message.roomId}`);
    }

    if (message.senderId && !userIds.has(message.senderId)) {
      errors.push(`message ${message.id} references missing sender ${message.senderId}`);
    }

    if (message.type === "text" && !message.text?.trim()) {
      errors.push(`message ${message.id} is missing text`);
    }
  }

  const busRouteIds = new Set(database.busRoutes.map((route) => route.id));
  const busStopIds = new Set(database.busStops.map((stop) => stop.id));
  const busRouteStopPairs = new Set<string>();
  const busRouteSequenceSlots = new Map<string, Set<number>>();

  for (const link of database.busRouteStops) {
    if (!busRouteIds.has(link.routeId)) {
      errors.push(
        `bus route-stop link references missing route ${link.routeId}`,
      );
    }
    if (!busStopIds.has(link.stopId)) {
      errors.push(
        `bus route-stop link references missing stop ${link.stopId}`,
      );
    }
    busRouteStopPairs.add(`${link.routeId}::${link.stopId}`);

    const slots = busRouteSequenceSlots.get(link.routeId) ?? new Set<number>();
    if (slots.has(link.sequence)) {
      errors.push(
        `bus route ${link.routeId} has duplicate sequence ${link.sequence}`,
      );
    }
    slots.add(link.sequence);
    busRouteSequenceSlots.set(link.routeId, slots);
  }

  const busSightingIds = new Set<string>();
  for (const sighting of database.busSightings) {
    if (busSightingIds.has(sighting.id)) {
      errors.push(`duplicate bus sighting id: ${sighting.id}`);
    }
    busSightingIds.add(sighting.id);

    if (!busRouteIds.has(sighting.routeId)) {
      errors.push(
        `bus sighting ${sighting.id} references missing route ${sighting.routeId}`,
      );
    }
    if (!busStopIds.has(sighting.stopId)) {
      errors.push(
        `bus sighting ${sighting.id} references missing stop ${sighting.stopId}`,
      );
    }
    if (!busRouteStopPairs.has(`${sighting.routeId}::${sighting.stopId}`)) {
      errors.push(
        `bus sighting ${sighting.id} reports a stop (${sighting.stopId}) that is not on route ${sighting.routeId}`,
      );
    }
    if (sighting.reporterId !== null && !userIds.has(sighting.reporterId)) {
      errors.push(
        `bus sighting ${sighting.id} references missing reporter ${sighting.reporterId}`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertDatabaseConsistency(database = connectMockDatabase()) {
  const result = validateDatabaseConsistency(database);

  if (!result.ok) {
    throw new Error(`Mock database integrity failed: ${result.errors.join("; ")}`);
  }
}
