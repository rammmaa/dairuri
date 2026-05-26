import type {
  Application,
  BusRoute,
  BusRouteStop,
  BusSighting,
  BusStop,
  ChatMessage,
  ChatRoom,
  Post,
} from "../types/domain";
import {
  BusSightingInputError,
  mockReporterLabel,
  normalizeRecordSightingInput,
  resolveNearestStop,
  type RecordBusSightingInput,
} from "./busArchiveCore";
import { assertDatabaseConsistency, connectMockDatabase } from "./mockDb";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPosts(): Promise<Post[]> {
  await delay();
  const database = connectMockDatabase();

  return [...database.posts];
}

export async function getPost(id: string): Promise<Post | undefined> {
  await delay();
  const database = connectMockDatabase();

  return database.posts.find((post) => post.id === id);
}

export async function createPost(input: Partial<Post>): Promise<Post> {
  await delay();
  const database = connectMockDatabase();
  const post = {
    ...database.posts[0],
    ...input,
    id: `post-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as Post;

  database.posts.unshift(post);
  assertDatabaseConsistency(database);
  return post;
}

export async function toggleLike(postId: string): Promise<Post | undefined> {
  await delay(80);
  const database = connectMockDatabase();
  const post = database.posts.find((item) => item.id === postId);

  if (post) {
    post.liked = !post.liked;
  }

  assertDatabaseConsistency(database);
  return post;
}

export async function applyToPost(
  postId: string,
  intro: string,
): Promise<Application> {
  await delay();
  const database = connectMockDatabase();

  if (!database.posts.some((post) => post.id === postId)) {
    throw new Error(`Cannot apply to missing post: ${postId}`);
  }

  const application: Application = {
    id: `application-${Date.now()}`,
    postId,
    applicant: database.users[0],
    intro,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  database.applications.unshift(application);
  assertDatabaseConsistency(database);
  return application;
}

export async function acceptApplication(applicationId: string): Promise<void> {
  await delay();
  const database = connectMockDatabase();
  const application = database.applications.find((item) => item.id === applicationId);

  if (!application) {
    throw new Error(`Cannot accept missing application: ${applicationId}`);
  }

  application.status = "accepted";
  assertDatabaseConsistency(database);
}

export async function rejectApplication(
  applicationId: string,
  reason: string,
): Promise<void> {
  await delay();
  const database = connectMockDatabase();
  const application = database.applications.find((item) => item.id === applicationId);

  if (!application) {
    throw new Error(`Cannot reject missing application: ${applicationId}`);
  }

  application.status = "rejected";
  application.rejectionReason = reason;
  assertDatabaseConsistency(database);
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  await delay();
  const database = connectMockDatabase();

  return [...database.chatRooms];
}

export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  await delay();
  const database = connectMockDatabase();

  return database.messages.filter((message) => message.roomId === roomId);
}

export async function sendMessage(
  roomId: string,
  text: string,
): Promise<ChatMessage> {
  await delay(80);
  const database = connectMockDatabase();

  if (!database.chatRooms.some((room) => room.id === roomId)) {
    throw new Error(`Cannot send message to missing room: ${roomId}`);
  }

  const message: ChatMessage = {
    id: `message-${Date.now()}`,
    roomId,
    senderId: "me",
    type: "text",
    text,
    createdAt: new Date().toISOString(),
  };

  database.messages.push(message);
  assertDatabaseConsistency(database);
  return message;
}

// ---------------------------------------------------------------------------
// Happy Bus archive
// ---------------------------------------------------------------------------
//
// The mock implementation mirrors server/api/busArchive.ts as closely as the
// runtime allows. Stop snapping uses the same haversine helper from
// services/busArchiveCore.ts so the snap behavior is identical. The reporter
// label algorithm differs (mock uses mockReporterLabel / FNV-1a; live uses
// sha256) because Node's createHash is not in the React Native bundle; both
// satisfy the same stability + "deleted" + 6-char-hex contract.

export async function getBusRoutes(): Promise<BusRoute[]> {
  await delay(60);
  const database = connectMockDatabase();
  const latestByRoute = new Map<string, string>();
  for (const sighting of database.busSightings) {
    const existing = latestByRoute.get(sighting.routeId);
    if (!existing || sighting.createdAt > existing) {
      latestByRoute.set(sighting.routeId, sighting.createdAt);
    }
  }
  return database.busRoutes.map((route) => ({
    ...route,
    lastSightingAt: latestByRoute.get(route.id),
  }));
}

export async function getBusRouteStops(): Promise<BusRouteStop[]> {
  await delay(50);
  const database = connectMockDatabase();
  return database.busRouteStops.map((link) => ({
    routeId: link.routeId,
    stopId: link.stopId,
    sequence: link.sequence,
  }));
}

export async function getBusStops(): Promise<BusStop[]> {
  await delay(80);
  const database = connectMockDatabase();
  const latestByStop = new Map<string, string>();
  for (const sighting of database.busSightings) {
    const existing = latestByStop.get(sighting.stopId);
    if (!existing || sighting.createdAt > existing) {
      latestByStop.set(sighting.stopId, sighting.createdAt);
    }
  }
  return database.busStops.map((stop) => ({
    ...stop,
    lastSightingAt: latestByStop.get(stop.id),
  }));
}

export async function getStopSightings(
  stopId: string,
  limit = 20,
): Promise<BusSighting[]> {
  await delay(60);
  const database = connectMockDatabase();
  const boundedLimit = Math.min(Math.max(limit, 1), 100);
  return database.busSightings
    .filter((sighting) => sighting.stopId === stopId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, boundedLimit)
    .map(toMockBusSighting);
}

export async function recordBusSighting(
  input: RecordBusSightingInput,
): Promise<BusSighting> {
  await delay(80);
  const database = connectMockDatabase();
  const validated = normalizeRecordSightingInput(input);

  const routeStopIds = new Set(
    database.busRouteStops
      .filter((link) => link.routeId === validated.routeId)
      .map((link) => link.stopId),
  );

  if (routeStopIds.size === 0) {
    throw new BusSightingInputError("route not found");
  }

  const candidates = database.busStops
    .filter((stop) => routeStopIds.has(stop.id))
    .map((stop) => ({
      stopId: stop.id,
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));

  const selectedStop = validated.stopId
    ? candidates.find((stop) => stop.stopId === validated.stopId)
    : resolveNearestStop(
        { latitude: validated.latitude, longitude: validated.longitude },
        candidates,
      );

  if (validated.stopId && !selectedStop) {
    throw new BusSightingInputError("stop not on route");
  }

  if (!selectedStop) {
    throw new BusSightingInputError("no nearby stop on route");
  }

  // Mock mode runs without an authenticated user header, so it pins the
  // reporter to the local mockMe profile. The mockReporterLabel function
  // derives a stable 6-char identifier from that id.
  const reporterId = database.users[0]?.id ?? null;

  const raw = {
    id: `sighting-${Date.now()}`,
    routeId: validated.routeId,
    stopId: selectedStop.stopId,
    reporterId,
    latitude: validated.latitude,
    longitude: validated.longitude,
    createdAt: new Date().toISOString(),
  };

  database.busSightings.push(raw);
  assertDatabaseConsistency(database);
  return toMockBusSighting(raw);
}

function toMockBusSighting(raw: {
  id: string;
  routeId: string;
  stopId: string;
  reporterId: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
}): BusSighting {
  return {
    id: raw.id,
    routeId: raw.routeId,
    stopId: raw.stopId,
    reporterLabel: mockReporterLabel(raw.reporterId),
    latitude: raw.latitude,
    longitude: raw.longitude,
    createdAt: raw.createdAt,
  };
}
