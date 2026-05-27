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
import { clearAuthSession, setAuthSession } from "./authSession";
import type { RecordBusSightingInput } from "./busArchiveCore";

export async function login(input: LoginInput): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: input,
  });
  setAuthSession(session.token, session.user);
  return session;
}

export async function signup(input: SignupInput): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/auth/signup", {
    method: "POST",
    body: input,
  });
  setAuthSession(session.token, session.user);
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

export async function getApplicationDetail(
  applicationId: string,
): Promise<ApplicationDetail> {
  return apiRequest<ApplicationDetail>(
    `/applications/${encodeURIComponent(applicationId)}`,
  );
}

export async function getApplicationsForPost(
  postId: string,
): Promise<Application[]> {
  return apiRequest<Application[]>(
    `/posts/${encodeURIComponent(postId)}/applications`,
  );
}

export async function acceptApplication(applicationId: string): Promise<ChatRoom> {
  return apiRequest<ChatRoom>(
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

export async function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/me");
}

export async function updateMe(
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  return apiRequest<UserProfile>("/me", {
    method: "PATCH",
    body: input,
  });
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiRequest<void>("/me/password", {
    method: "PATCH",
    body: input,
  });
}

export async function deleteMe(): Promise<void> {
  await apiRequest<void>("/me", {
    method: "DELETE",
  });
  clearAuthSession();
}

export async function getMyPosts(): Promise<Post[]> {
  return apiRequest<Post[]>("/me/posts");
}

export async function getSavedPosts(): Promise<Post[]> {
  return apiRequest<Post[]>("/me/saved-posts");
}

export async function getReceivedApplications(): Promise<ApplicationDetail[]> {
  return apiRequest<ApplicationDetail[]>("/me/received-applications");
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

export async function submitReport(
  roomId: string,
  reason: string,
): Promise<void> {
  await apiRequest<void>("/reports", {
    method: "POST",
    body: { roomId, reason },
  });
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
  return apiRequest<BusSighting>("/bus/sightings", {
    method: "POST",
    body: input,
  });
}
