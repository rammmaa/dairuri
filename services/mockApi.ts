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
import { clearAuthSession, setAuthSession } from "./authSession";
import {
  BusSightingInputError,
  mockReporterLabel,
  normalizeRecordSightingInput,
  resolveNearestStop,
  type RecordBusSightingInput,
} from "./busArchiveCore";
import { assertDatabaseConsistency, connectMockDatabase } from "./mockDb";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
const mockPhoneVerifications = new Map<
  string,
  { phone: string; code: string; token?: string }
>();

export async function login(input: LoginInput): Promise<AuthSession> {
  await delay(40);
  if (!input.identifier.trim() || !input.password.trim()) {
    throw new Error("아이디와 비밀번호를 입력해주세요.");
  }

  const database = connectMockDatabase();
  const user = database.users[0];
  const session = { token: "mock-session-token", user };
  setAuthSession(session.token, session.user);
  return session;
}

export async function signup(input: SignupInput): Promise<AuthSession> {
  await delay(60);
  if (!input.nickname.trim() || !input.phone.trim() || input.password.length < 8) {
    throw new Error("회원가입 정보를 확인해주세요.");
  }

  const phoneVerification = mockPhoneVerifications.get(input.phoneVerification.id);
  if (
    !phoneVerification?.token ||
    phoneVerification.token !== input.phoneVerification.token ||
    phoneVerification.phone !== input.phone
  ) {
    throw new Error("전화번호 인증을 완료해주세요.");
  }

  const database = connectMockDatabase();
  const existing = database.users.find((user) => user.phone === input.phone);
  const user: UserProfile =
    existing ??
    {
      id: `user-${Date.now()}`,
      nickname: input.nickname,
      realName: input.realName,
      phone: input.phone,
      email: input.email,
      avatarUrl: undefined,
      area: "다로리",
      temperature: 36.5,
      driverType: input.driverType,
      vehicle: input.vehicle,
    };

  if (!existing) {
    database.users.unshift(user);
  }

  const session = { token: "mock-session-token", user };
  setAuthSession(session.token, session.user);
  return session;
}

export async function requestPhoneVerification(
  input: PhoneVerificationStartInput,
): Promise<PhoneVerificationStartResult> {
  await delay(20);
  const phone = input.phone.trim();
  if (!phone) {
    throw new Error("전화번호를 입력해주세요.");
  }

  const verificationId = `mock-phone-verification-${Date.now()}`;
  const code = process.env.NODE_ENV === "test" ? "123456" : "000000";
  mockPhoneVerifications.set(verificationId, { phone, code });

  return {
    verificationId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    debugCode: code,
  };
}

export async function confirmPhoneVerification(
  input: PhoneVerificationConfirmInput,
): Promise<PhoneVerificationConfirmResult> {
  await delay(20);
  const verification = mockPhoneVerifications.get(input.verificationId);
  if (!verification || verification.code !== input.code.trim()) {
    throw new Error("인증번호를 확인해주세요.");
  }

  const token = `mock-phone-token-${input.verificationId}`;
  verification.token = token;

  return {
    verificationId: input.verificationId,
    phone: verification.phone,
    verifiedToken: token,
    verifiedAt: new Date().toISOString(),
  };
}

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
  const currentUser = database.users[0] ?? database.posts[0].author;
  const post = {
    ...database.posts[0],
    ...input,
    id: `post-${Date.now()}`,
    author: currentUser,
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

export async function getApplicationDetail(
  applicationId: string,
): Promise<ApplicationDetail> {
  await delay();
  const database = connectMockDatabase();
  const application = database.applications.find((item) => item.id === applicationId);

  if (!application) {
    throw new Error(`Cannot find missing application: ${applicationId}`);
  }

  const post = database.posts.find((item) => item.id === application.postId);
  if (!post) {
    throw new Error(`Cannot find post for application: ${applicationId}`);
  }

  return { application, post };
}

export async function getApplicationsForPost(postId: string): Promise<Application[]> {
  await delay();
  const database = connectMockDatabase();
  return database.applications.filter((application) => application.postId === postId);
}

export async function acceptApplication(applicationId: string): Promise<ChatRoom> {
  await delay();
  const database = connectMockDatabase();
  const application = database.applications.find((item) => item.id === applicationId);

  if (!application) {
    throw new Error(`Cannot accept missing application: ${applicationId}`);
  }

  const post = database.posts.find((item) => item.id === application.postId);
  if (!post) {
    throw new Error(`Cannot accept application for missing post: ${application.postId}`);
  }

  application.status = "accepted";
  const roomId = `room-${application.id}`;
  let room = database.chatRooms.find((item) => item.id === roomId);

  if (!room) {
    const participants = [post.author, application.applicant].filter(
      (participant, index, list) =>
        list.findIndex((item) => item.id === participant.id) === index,
    );
    room = {
      id: roomId,
      title:
        post.type === "job" ? `${post.title} 연락방` : `${post.title} 매칭방`,
      subtitle:
        post.type === "job"
          ? `${post.placeName} / ${post.jobCategory ?? "인재 풀 등록"}`
          : `${post.departure} > ${post.destination} / ${post.days.join(", ")} ${post.startTime}`,
      participants,
      postId: post.id,
      lastMessage: "매칭이 시작되었습니다.",
      unreadCount: 0,
    };
    database.chatRooms.unshift(room);
  }

  if (!database.messages.some((message) => message.id === `system-${application.id}-accepted`)) {
    database.messages.push({
      id: `system-${application.id}-accepted`,
      roomId,
      type: "system",
      text: "매칭이 시작되었습니다.",
      createdAt: new Date().toISOString(),
    });
  }

  assertDatabaseConsistency(database);
  return room;
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

export async function getMe(): Promise<UserProfile> {
  await delay(60);
  const database = connectMockDatabase();
  return database.users[0];
}

export async function updateMe(
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  await delay(80);
  const database = connectMockDatabase();
  const user = database.users[0];

  if (input.nickname !== undefined) {
    const nickname = input.nickname.trim();
    if (!nickname) {
      throw new Error("nickname is required");
    }
    user.nickname = nickname;
  }

  if (input.driverType !== undefined) {
    user.driverType = input.driverType;
  }

  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl ?? undefined;
  }

  assertDatabaseConsistency(database);
  return user;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await delay(60);
  if (!input.currentPassword.trim() || input.newPassword.length < 8) {
    throw new Error("비밀번호를 확인해주세요.");
  }
}

export async function deleteMe(): Promise<void> {
  await delay(60);
  clearAuthSession();
}

export async function getMyPosts(): Promise<Post[]> {
  await delay();
  const database = connectMockDatabase();
  const currentUserId = database.users[0]?.id;
  return database.posts.filter((post) => post.author.id === currentUserId);
}

export async function getSavedPosts(): Promise<Post[]> {
  await delay();
  const database = connectMockDatabase();
  return database.posts.filter((post) => post.liked);
}

export async function getReceivedApplications(): Promise<ApplicationDetail[]> {
  await delay();
  const database = connectMockDatabase();
  const currentUserId = database.users[0]?.id;
  return database.applications.flatMap((application) => {
    const post = database.posts.find((item) => item.id === application.postId);
    return post && post.author.id === currentUserId ? [{ application, post }] : [];
  });
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

export async function submitReport(roomId: string, reason: string): Promise<void> {
  await delay(60);
  const database = connectMockDatabase();
  if (!database.chatRooms.some((room) => room.id === roomId)) {
    throw new Error(`Cannot report missing room: ${roomId}`);
  }
  if (!reason.trim()) {
    throw new Error("신고 사유를 선택해주세요.");
  }
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
