import type {
  Application,
  ApplicationDetail,
  AuthSession,
  BusRoute,
  BusRouteStop,
  BusSighting,
  BusStop,
  ChangePasswordInput,
  ChatMessage,
  ChatRoom,
  LoginInput,
  PhoneVerificationConfirmInput,
  PhoneVerificationConfirmResult,
  PhoneVerificationStartInput,
  PhoneVerificationStartResult,
  Post,
  SignupInput,
  UpdateUserProfileInput,
  UserProfile,
} from "../types/domain";
import { apiRequest } from "./apiClient";
import {
  clearPersistedAuthSession,
  getAuthToken,
  persistAuthSession,
} from "./authSession";
import type { RecordBusSightingInput } from "./busArchiveCore";
import * as mockApi from "./mockApi";

function shouldUseWebTestFallback() {
  return (
    process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH === "true" &&
    !getAuthToken()
  );
}

function withWebTestFallback<T>(
  liveRequest: () => Promise<T>,
  fallbackRequest: () => Promise<T>,
) {
  return shouldUseWebTestFallback() ? fallbackRequest() : liveRequest();
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: input,
  });
  await persistAuthSession(session.token, session.user);
  return session;
}

export async function signup(input: SignupInput): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/auth/signup", {
    method: "POST",
    body: input,
  });
  await persistAuthSession(session.token, session.user);
  return session;
}

export async function requestPhoneVerification(
  input: PhoneVerificationStartInput,
): Promise<PhoneVerificationStartResult> {
  return apiRequest<PhoneVerificationStartResult>("/auth/phone-verifications", {
    method: "POST",
    body: input,
  });
}

export async function confirmPhoneVerification(
  input: PhoneVerificationConfirmInput,
): Promise<PhoneVerificationConfirmResult> {
  return apiRequest<PhoneVerificationConfirmResult>(
    `/auth/phone-verifications/${encodeURIComponent(input.verificationId)}/confirm`,
    {
      method: "POST",
      body: { code: input.code },
    },
  );
}

export async function getPosts(): Promise<Post[]> {
  return withWebTestFallback(
    () => apiRequest<Post[]>("/posts"),
    () => mockApi.getPosts(),
  );
}

export async function getPost(id: string): Promise<Post | undefined> {
  if (shouldUseWebTestFallback()) {
    return mockApi.getPost(id);
  }

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
  return withWebTestFallback(
    () =>
      apiRequest<Post>("/posts", {
        method: "POST",
        body: input,
      }),
    () => mockApi.createPost(input),
  );
}

export async function toggleLike(postId: string): Promise<Post | undefined> {
  return withWebTestFallback(
    () =>
      apiRequest<Post>(`/posts/${encodeURIComponent(postId)}/like`, {
        method: "POST",
      }),
    () => mockApi.toggleLike(postId),
  );
}

export async function applyToPost(
  postId: string,
  intro: string,
): Promise<Application> {
  return withWebTestFallback(
    () =>
      apiRequest<Application>(
        `/posts/${encodeURIComponent(postId)}/applications`,
        {
          method: "POST",
          body: { intro },
        },
      ),
    () => mockApi.applyToPost(postId, intro),
  );
}

export async function getApplicationDetail(
  applicationId: string,
): Promise<ApplicationDetail> {
  return withWebTestFallback(
    () =>
      apiRequest<ApplicationDetail>(
        `/applications/${encodeURIComponent(applicationId)}`,
      ),
    () => mockApi.getApplicationDetail(applicationId),
  );
}

export async function getApplicationsForPost(
  postId: string,
): Promise<Application[]> {
  return withWebTestFallback(
    () =>
      apiRequest<Application[]>(
        `/posts/${encodeURIComponent(postId)}/applications`,
      ),
    () => mockApi.getApplicationsForPost(postId),
  );
}

export async function acceptApplication(applicationId: string): Promise<ChatRoom> {
  return withWebTestFallback(
    () =>
      apiRequest<ChatRoom>(
        `/applications/${encodeURIComponent(applicationId)}/accept`,
        {
          method: "POST",
        },
      ),
    () => mockApi.acceptApplication(applicationId),
  );
}

export async function rejectApplication(
  applicationId: string,
  reason: string,
): Promise<void> {
  await withWebTestFallback(
    () =>
      apiRequest<void>(
        `/applications/${encodeURIComponent(applicationId)}/reject`,
        {
          method: "POST",
          body: { reason },
        },
      ),
    () => mockApi.rejectApplication(applicationId, reason),
  );
}

export async function getMe(): Promise<UserProfile> {
  return withWebTestFallback(
    () => apiRequest<UserProfile>("/me"),
    () => mockApi.getMe(),
  );
}

export async function updateMe(
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  return withWebTestFallback(
    () =>
      apiRequest<UserProfile>("/me", {
        method: "PATCH",
        body: input,
      }),
    () => mockApi.updateMe(input),
  );
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await withWebTestFallback(
    () =>
      apiRequest<void>("/me/password", {
        method: "PATCH",
        body: input,
      }),
    () => mockApi.changePassword(input),
  );
}

export async function deleteMe(): Promise<void> {
  await withWebTestFallback(
    () =>
      apiRequest<void>("/me", {
        method: "DELETE",
      }),
    () => mockApi.deleteMe(),
  );
  if (!shouldUseWebTestFallback()) {
    await clearPersistedAuthSession();
  }
}

export async function getMyPosts(): Promise<Post[]> {
  return withWebTestFallback(
    () => apiRequest<Post[]>("/me/posts"),
    () => mockApi.getMyPosts(),
  );
}

export async function getSavedPosts(): Promise<Post[]> {
  return withWebTestFallback(
    () => apiRequest<Post[]>("/me/saved-posts"),
    () => mockApi.getSavedPosts(),
  );
}

export async function getReceivedApplications(): Promise<ApplicationDetail[]> {
  return withWebTestFallback(
    () => apiRequest<ApplicationDetail[]>("/me/received-applications"),
    () => mockApi.getReceivedApplications(),
  );
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  return withWebTestFallback(
    () => apiRequest<ChatRoom[]>("/chat/rooms"),
    () => mockApi.getChatRooms(),
  );
}

export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  return withWebTestFallback(
    () =>
      apiRequest<ChatMessage[]>(
        `/chat/rooms/${encodeURIComponent(roomId)}/messages`,
      ),
    () => mockApi.getChatMessages(roomId),
  );
}

export async function sendMessage(
  roomId: string,
  text: string,
): Promise<ChatMessage> {
  return withWebTestFallback(
    () =>
      apiRequest<ChatMessage>(
        `/chat/rooms/${encodeURIComponent(roomId)}/messages`,
        {
          method: "POST",
          body: { text },
        },
      ),
    () => mockApi.sendMessage(roomId, text),
  );
}

export async function submitReport(
  roomId: string,
  reason: string,
): Promise<void> {
  await withWebTestFallback(
    () =>
      apiRequest<void>("/reports", {
        method: "POST",
        body: { roomId, reason },
      }),
    () => mockApi.submitReport(roomId, reason),
  );
}

// ---------------------------------------------------------------------------
// Happy Bus archive (live API)
// ---------------------------------------------------------------------------

export async function getBusRoutes(): Promise<BusRoute[]> {
  return apiRequest<BusRoute[]>("/bus/routes");
}

export async function getBusStops(): Promise<BusStop[]> {
  return apiRequest<BusStop[]>("/bus/stops");
}

export async function getBusRouteStops(): Promise<BusRouteStop[]> {
  return apiRequest<BusRouteStop[]>("/bus/route-stops");
}

export async function getStopSightings(
  stopId: string,
  limit?: number,
): Promise<BusSighting[]> {
  const query = limit !== undefined ? `?limit=${encodeURIComponent(limit)}` : "";
  return apiRequest<BusSighting[]>(
    `/bus/stops/${encodeURIComponent(stopId)}/sightings${query}`,
  );
}

export async function recordBusSighting(
  input: RecordBusSightingInput,
): Promise<BusSighting> {
  return withWebTestFallback(
    () =>
      apiRequest<BusSighting>("/bus/sightings", {
        method: "POST",
        body: input,
      }),
    () => mockApi.recordBusSighting(input),
  );
}
