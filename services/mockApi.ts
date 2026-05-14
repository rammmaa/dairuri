import type { Application, ChatMessage, ChatRoom, Post } from "../types/domain";
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
