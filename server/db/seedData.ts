import {
  mockAuthor,
  mockBusRoutes,
  mockBusRouteStops,
  mockBusSightings,
  mockBusStops,
  mockMe,
} from "../../data/mockDomain";
import type { Application, DriverType, Post } from "../../types/domain";

export type SeedRecords = ReturnType<typeof createSeedRecords>;

type SeedPostRecord = {
  id: string;
  type: Post["type"];
  title: string;
  body: string;
  authorId: string;
  imageUrls: string[];
  status: "open" | "closed";
  placeName: string | null;
  placeAddress: string | null;
  departure: string | null;
  destination: string | null;
  days: Post["days"];
  startTime: string;
  endTime: string | null;
  wageType: "hourly" | "monthly" | null;
  wageAmount: number | null;
  jobCategory: string | null;
  profileMode: "resource" | null;
  availableTasks: string[];
  employmentTypes: Array<"fullTime" | "partTime" | "shortTerm">;
  preferredPay: string | null;
  availabilityNote: string | null;
  contactNote: string | null;
  price: number | null;
  seats: number | null;
  createdAt: string;
};

type SeedApplicationRecord = {
  id: string;
  postId: string;
  applicantId: string;
  intro: string;
  status: Application["status"];
  rejectionReason: string | null;
  createdAt: string;
};

type SeedChatRoomRecord = {
  id: string;
  postId: string | null;
  title: string;
  subtitle: string | null;
};

type SeedChatRoomParticipantRecord = {
  roomId: string;
  userId: string;
};

type SeedChatMessageRecord = {
  id: string;
  roomId: string;
  senderId: string | null;
  type: "system" | "text";
  text: string;
  createdAt: string;
};

type SeedPostLikeRecord = {
  postId: string;
  userId: string;
};

const TEST_USER_PASSWORD_HASH =
  "scrypt:dairuri-seed-password-v1:88964ec5d4efb02f1031402ac773835e474f677a1b51da422d455fa944c1902a442da6bd84fdd90ebf34d8cd2793508c1109db6e2775146a3690ca2e8b1315b8";

export function createSeedRecords() {
  const users = [mockMe, mockAuthor].map((user) => ({
    id: user.id,
    nickname: user.nickname,
    realName: user.realName ?? null,
    phone: user.phone ?? `${user.id}@darori.local`,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    area: user.area ?? null,
    temperature: user.temperature,
    driverType: toDatabaseDriverType(user.driverType),
    passwordHash: user.id === mockMe.id ? TEST_USER_PASSWORD_HASH : null,
  }));

  const vehicles = [mockMe, mockAuthor]
    .filter((user) => user.vehicle)
    .map((user) => ({
      id: `${user.id}-vehicle`,
      userId: user.id,
      plateNumber: user.vehicle?.plateNumber ?? "",
      modelName: user.vehicle?.modelName ?? null,
      imageUrls: user.vehicle?.images ?? [],
    }));

  const posts: SeedPostRecord[] = [];
  const postLikes: SeedPostLikeRecord[] = [];
  const applications: SeedApplicationRecord[] = [];
  const chatRooms: SeedChatRoomRecord[] = [];
  const chatRoomParticipants: SeedChatRoomParticipantRecord[] = [];
  const chatMessages: SeedChatMessageRecord[] = [];

  const busRoutes = mockBusRoutes.map((route) => ({
    id: route.id,
    code: route.code,
    name: route.name,
    color: route.color,
  }));

  const busStops = mockBusStops.map((stop) => ({
    id: stop.id,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));

  const busRouteStops = mockBusRouteStops.map((link) => ({
    routeId: link.routeId,
    stopId: link.stopId,
    sequence: link.sequence,
  }));

  const busSightings = mockBusSightings.map((sighting) => ({
    id: sighting.id,
    routeId: sighting.routeId,
    stopId: sighting.stopId,
    reporterId: sighting.reporterId,
    latitude: sighting.latitude,
    longitude: sighting.longitude,
    createdAt: sighting.createdAt,
  }));

  return {
    users,
    vehicles,
    posts,
    postLikes,
    applications,
    chatRooms,
    chatRoomParticipants,
    chatMessages,
    busRoutes,
    busStops,
    busRouteStops,
    busSightings,
  };
}

function toDatabaseDriverType(driverType: DriverType) {
  return driverType === "driver" ? "driver" : "non_driver";
}
