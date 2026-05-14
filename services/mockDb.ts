import {
  mockApplications,
  mockAuthor,
  mockChatRooms,
  mockMe,
  mockMessages,
  mockPosts,
} from "../data/mockDomain";
import type {
  Application,
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
    };
  }

  assertDatabaseConsistency(connection);
  return connection;
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
