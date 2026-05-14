import {
  mockApplications,
  mockAuthor,
  mockChatRooms,
  mockMe,
  mockMessages,
  mockPosts,
} from "../../data/mockDomain";
import type { DriverType, Post } from "../../types/domain";

export type SeedRecords = ReturnType<typeof createSeedRecords>;

export function createSeedRecords() {
  const users = [mockMe, mockAuthor].map((user) => ({
    id: user.id,
    nickname: user.nickname,
    realName: user.realName ?? null,
    phone: user.phone ?? `${user.id}@darori.local`,
    email: user.email ?? null,
    area: user.area ?? null,
    temperature: user.temperature,
    driverType: toDatabaseDriverType(user.driverType),
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

  const posts = mockPosts.map((post) => ({
    id: post.id,
    type: post.type,
    title: post.title,
    body: post.body,
    authorId: post.author.id,
    imageUrls: post.imageUrls,
    status: post.status === "matched" ? "closed" : post.status,
    placeName: post.type === "job" ? post.placeName : null,
    placeAddress: post.type === "job" ? post.placeAddress ?? null : null,
    departure: post.type === "carpool" ? post.departure : null,
    destination: post.type === "carpool" ? post.destination : null,
    days: post.days,
    startTime: post.startTime,
    endTime: post.endTime ?? null,
    wageType: post.type === "job" ? post.wageType : null,
    wageAmount: post.type === "job" ? post.wageAmount : null,
    jobCategory: post.type === "job" ? post.jobCategory ?? null : null,
    price: post.type === "carpool" ? post.price ?? null : null,
    seats: post.type === "carpool" ? post.seats ?? null : null,
    createdAt: post.createdAt,
  }));

  const postLikes = mockPosts
    .filter((post) => post.liked)
    .map((post) => ({ postId: post.id, userId: mockMe.id }));

  const applications = mockApplications.map((application) => ({
    id: application.id,
    postId: application.postId,
    applicantId: application.applicant.id,
    intro: application.intro,
    status: application.status,
    rejectionReason: application.rejectionReason ?? null,
    createdAt: application.createdAt,
  }));

  const chatRooms = mockChatRooms.map((room) => ({
    id: room.id,
    postId: room.postId ?? null,
    title: room.title,
    subtitle: room.subtitle ?? null,
  }));

  const chatRoomParticipants = mockChatRooms.flatMap((room) =>
    room.participants.map((participant) => ({
      roomId: room.id,
      userId: participant.id,
    })),
  );

  const chatMessages = mockMessages.map((message) => ({
    id: message.id,
    roomId: message.roomId,
    senderId: message.senderId ?? null,
    type: message.type === "postCard" ? "text" : message.type,
    text: message.text ?? formatPostCardMessage(message.post),
    createdAt: message.createdAt,
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
  };
}

function toDatabaseDriverType(driverType: DriverType) {
  return driverType === "driver" ? "driver" : "non_driver";
}

function formatPostCardMessage(post: Post | undefined) {
  return post ? post.title : "";
}
