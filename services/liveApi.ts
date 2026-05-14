import type { Application, ChatMessage, ChatRoom, Post } from "../types/domain";
import { apiRequest } from "./apiClient";

export async function getPosts(): Promise<Post[]> {
  return apiRequest<Post[]>("/posts");
}

export async function getPost(id: string): Promise<Post | undefined> {
  try {
    return await apiRequest<Post>(`/posts/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return undefined;
    }

    throw error;
  }
}

export async function createPost(input: Partial<Post>): Promise<Post> {
  return apiRequest<Post>("/posts", {
    method: "POST",
    body: input,
  });
}

export async function toggleLike(postId: string): Promise<Post | undefined> {
  return apiRequest<Post>(`/posts/${encodeURIComponent(postId)}/like`, {
    method: "POST",
  });
}

export async function applyToPost(
  postId: string,
  intro: string,
): Promise<Application> {
  return apiRequest<Application>(
    `/posts/${encodeURIComponent(postId)}/applications`,
    {
      method: "POST",
      body: { intro },
    },
  );
}

export async function acceptApplication(applicationId: string): Promise<void> {
  await apiRequest<void>(
    `/applications/${encodeURIComponent(applicationId)}/accept`,
    {
      method: "POST",
    },
  );
}

export async function rejectApplication(
  applicationId: string,
  reason: string,
): Promise<void> {
  await apiRequest<void>(
    `/applications/${encodeURIComponent(applicationId)}/reject`,
    {
      method: "POST",
      body: { reason },
    },
  );
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  return apiRequest<ChatRoom[]>("/chat/rooms");
}

export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(
    `/chat/rooms/${encodeURIComponent(roomId)}/messages`,
  );
}

export async function sendMessage(
  roomId: string,
  text: string,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(
    `/chat/rooms/${encodeURIComponent(roomId)}/messages`,
    {
      method: "POST",
      body: { text },
    },
  );
}
