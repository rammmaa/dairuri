import {
  mockBusRoutes,
  mockBusRouteStops,
  mockBusSightings,
  mockBusStops,
} from "../../data/mockDomain";
import type { Application, Post } from "../../types/domain";

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

export function createSeedRecords() {
  const users: Array<{
    id: string;
    loginId: string | null;
    nickname: string;
    realName: string | null;
    phone: string;
    email: string | null;
    avatarUrl: string | null;
    area: string | null;
    temperature: number;
    driverType: "driver" | "non_driver";
    licenseVerified: boolean;
    insuranceVerified: boolean;
    driverVerifiedAt: string | null;
    passwordHash: string | null;
  }> = [];
  const vehicles: Array<{
    id: string;
    userId: string;
    plateNumber: string;
    modelName: string | null;
    imageUrls: string[];
  }> = [];

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
    reporterId: null,
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
