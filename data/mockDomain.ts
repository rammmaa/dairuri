import type {
  Application,
  BusRoute,
  BusStop,
  ChatMessage,
  ChatRoom,
  Post,
  RouteOption,
  UserProfile,
} from "../types/domain";

export const mockMe: UserProfile = {
  id: "me",
  loginId: "rammma",
  nickname: "다로리인",
  realName: "하람",
  phone: "010-0000-0000",
  email: "test@example.com",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=420",
  area: "남성현역",
  temperature: 40.6,
  driverType: "driver",
  driverVerification: {
    licenseVerified: true,
    insuranceVerified: true,
    verifiedAt: "2026-05-14T00:00:00.000Z",
  },
  vehicle: {
    plateNumber: "123가 5678",
    modelName: "SUV",
    images: [
      "https://images.unsplash.com/photo-1549924231-f129b911e442?w=420",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=420",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=420",
    ],
  },
};

export const mockAuthor: UserProfile = {
  id: "author-1",
  loginId: "darori_author",
  nickname: "우리마이사랑해",
  realName: "김진도",
  phone: "010-1234-4567",
  area: "프로필 보기",
  temperature: 80,
  driverType: "driver",
  driverVerification: {
    licenseVerified: true,
    insuranceVerified: true,
    verifiedAt: "2026-05-14T00:00:00.000Z",
  },
  vehicle: {
    plateNumber: "357나2703",
    modelName: "벤츠",
    images: ["https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=420"],
  },
};

export const mockPosts: Post[] = [
  {
    id: "job-1",
    type: "job",
    profileMode: "resource",
    title: "농촌 일손과 카페 보조 도울 수 있어요",
    body:
      "마을에 새로 정착하면서 가능한 일을 지역 분들께 알리고 싶어요. 카페 보조, 농번기 일손, 아이 등하원 동행처럼 시간 맞춰 도울 수 있는 일을 찾고 있습니다.",
    author: mockAuthor,
    imageUrls: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=720"],
    liked: true,
    status: "open",
    createdAt: "2026-05-14T08:20:00.000Z",
    placeName: "다로리 카페 인근",
    placeAddress: "경북 청도군 다로리",
    days: ["화", "목"],
    startTime: "09:00",
    endTime: "15:00",
    wageType: "hourly",
    wageAmount: 12000,
    jobCategory: "인재 풀 등록",
    availableTasks: ["카페 보조", "농번기 일손", "아이 등하원 동행"],
    employmentTypes: ["partTime", "shortTerm"],
    preferredPay: "시급 12,000원부터",
    availabilityNote: "화, 목 오전부터 오후까지 가능해요.",
    contactNote: "일정과 장소를 먼저 알려주시면 빠르게 답할게요.",
  },
  {
    id: "carpool-1",
    type: "carpool",
    title: "‘청도감 학원’ 함께 다니실 사람 구해요",
    body:
      "평일 저녁에 청도감 학원 방향으로 이동합니다. 조용히 이동하는 편이고 시간은 정확히 맞춰요.",
    author: mockMe,
    imageUrls: ["https://images.unsplash.com/photo-1549924231-f129b911e442?w=720"],
    liked: false,
    status: "open",
    createdAt: "2026-05-14T07:10:00.000Z",
    departure: "다로리 카페",
    destination: "청도명어학원",
    days: ["화", "목"],
    startTime: "16:00",
    endTime: "17:00",
    seats: 3,
  },
];

export const mockApplications: Application[] = [
  {
    id: "application-1",
    postId: "carpool-1",
    applicant: mockAuthor,
    intro:
      "시간 약속을 잘 지키고 같은 방향으로 자주 이동합니다. 조용히 이동하는 편이라 부담 없으실 거예요.",
    status: "pending",
    createdAt: "2026-05-14T09:00:00.000Z",
  },
];

export const mockChatRooms: ChatRoom[] = [
  {
    id: "room-1",
    title: "‘청도감 학원’ 함께 다니실 사람 구해요",
    subtitle: "남성현역 > 청도명어학원 / 화, 목 16:00",
    participants: [mockMe, mockAuthor],
    postId: "carpool-1",
    lastMessage: "오늘 4시 20분 정문 앞에서 만나요!",
    unreadCount: 3,
  },
  {
    id: "room-2",
    title: "농촌 일손과 카페 보조 도울 수 있어요",
    subtitle: "다로리 카페 인근 / 인재 풀 등록",
    participants: [mockMe, mockAuthor],
    postId: "job-1",
    lastMessage: "목요일 오전 카페 보조 가능하신가요?",
    unreadCount: 0,
  },
];

export const mockMessages: ChatMessage[] = [
  {
    id: "system-1",
    roomId: "room-1",
    type: "system",
    text: "매칭이 시작되었습니다.",
    createdAt: "2026-05-14T09:05:00.000Z",
  },
  {
    id: "message-1",
    roomId: "room-1",
    senderId: "author-1",
    type: "text",
    text: "안녕하세요. 오늘도 같은 장소에서 만나면 될까요?",
    createdAt: "2026-05-14T09:06:00.000Z",
  },
  {
    id: "message-2",
    roomId: "room-1",
    senderId: "me",
    type: "text",
    text: "네, 4시 20분에 정문 앞으로 갈게요.",
    createdAt: "2026-05-14T09:08:00.000Z",
  },
  {
    id: "message-image-1",
    roomId: "room-1",
    senderId: "author-1",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=720",
    createdAt: "2026-05-14T09:09:00.000Z",
  },
];

export const mockRouteOptions: RouteOption[] = [
  {
    id: "1",
    label: "1",
    color: "#2563EB",
    coordinates: [
      { latitude: 35.6474, longitude: 128.7338 },
      { latitude: 35.649, longitude: 128.736 },
    ],
  },
  {
    id: "2",
    label: "2",
    color: "#22C55E",
    coordinates: [
      { latitude: 35.6472, longitude: 128.7336 },
      { latitude: 35.6501, longitude: 128.737 },
    ],
  },
];

// -----------------------------------------------------------------------------
// Happy Bus archive fixtures
// -----------------------------------------------------------------------------
//
// The six routes follow the Figma flow the user shared on 2026-05-26: their
// display names are the Happy Bus numbers 1 through 6 (numbered, not "line N"),
// identified visually by the numeric position in the 2x3 selection grid and
// not by hue. All routes therefore share a single mint color; the number is
// what distinguishes them. The route `code` stays H1-H6 so the per-route
// last-sighting matching by code keeps working even though the display name
// changed.
//
// The six stop names come from the Figma frames the user transcribed on
// 2026-05-26. Stop coordinates are placeholder values anchored near the
// Darori village area (~35.65 N, 128.73 E) and chosen so that stop spacing
// roughly matches the 300 m snap radius. The coordinates are NOT surveyed;
// they are reused in order from the previous fixture so the snap geometry
// stays stable across the rename.
//
// TODO(field-survey): replace these coordinates with measured values once a
//                     Darori field survey provides them. Do NOT change the
//                     002_bus_archive migration; only update this fixture and
//                     server/db/seedData.ts which derives from it.

const HAPPY_BUS_COLOR = "#00A866"; // mirrors colors.mintDark in the design tokens

export const mockBusRoutes: BusRoute[] = [
  { id: "route-happy-1", code: "H1", name: "행복버스 1번", color: HAPPY_BUS_COLOR },
  { id: "route-happy-2", code: "H2", name: "행복버스 2번", color: HAPPY_BUS_COLOR },
  { id: "route-happy-3", code: "H3", name: "행복버스 3번", color: HAPPY_BUS_COLOR },
  { id: "route-happy-4", code: "H4", name: "행복버스 4번", color: HAPPY_BUS_COLOR },
  { id: "route-happy-5", code: "H5", name: "행복버스 5번", color: HAPPY_BUS_COLOR },
  { id: "route-happy-6", code: "H6", name: "행복버스 6번", color: HAPPY_BUS_COLOR },
];

export const mockBusStops: BusStop[] = [
  { id: "stop-cheongdo-public-terminal", name: "청도공용버스터미널", latitude: 35.6474, longitude: 128.7338 },
  { id: "stop-gumiri", name: "구미리", latitude: 35.6492, longitude: 128.7355 },
  { id: "stop-arae-gumi", name: "아랫구미", latitude: 35.6501, longitude: 128.7370 },
  { id: "stop-wolgok-2-pakwol", name: "월곡2리(박월)", latitude: 35.6480, longitude: 128.7390 },
  { id: "stop-gwitturami-boiler", name: "귀뚜라미보일러", latitude: 35.6450, longitude: 128.7305 },
  { id: "stop-nonggong-entrance", name: "농공단지 입구", latitude: 35.6520, longitude: 128.7385 },
];

export type MockBusRouteStop = {
  routeId: string;
  stopId: string;
  sequence: number;
};

// H1 visits every stop as a loop so the merged route/stop selection screen
// defaults to a full six-stop list (the user asked for route 1 to be shown by
// default). The other routes visit three-stop subsets so the rejection branch
// and the snap tie-breaks still have varied geometry. The
// stops are intentionally shared across routes so junction tie-breaks in
// inferRouteAndStop have a realistic geometry to exercise. Sequence numbers
// are 1-based per route.
export const mockBusRouteStops: MockBusRouteStop[] = [
  // H1: every stop in order, the default selection list.
  { routeId: "route-happy-1", stopId: "stop-cheongdo-public-terminal", sequence: 1 },
  { routeId: "route-happy-1", stopId: "stop-gumiri", sequence: 2 },
  { routeId: "route-happy-1", stopId: "stop-arae-gumi", sequence: 3 },
  { routeId: "route-happy-1", stopId: "stop-wolgok-2-pakwol", sequence: 4 },
  { routeId: "route-happy-1", stopId: "stop-gwitturami-boiler", sequence: 5 },
  { routeId: "route-happy-1", stopId: "stop-nonggong-entrance", sequence: 6 },
  // H2: public-terminal -> gumiri -> arae-gumi
  { routeId: "route-happy-2", stopId: "stop-cheongdo-public-terminal", sequence: 1 },
  { routeId: "route-happy-2", stopId: "stop-gumiri", sequence: 2 },
  { routeId: "route-happy-2", stopId: "stop-arae-gumi", sequence: 3 },
  // H3: arae-gumi -> wolgok-2-pakwol -> gwitturami-boiler
  { routeId: "route-happy-3", stopId: "stop-arae-gumi", sequence: 1 },
  { routeId: "route-happy-3", stopId: "stop-wolgok-2-pakwol", sequence: 2 },
  { routeId: "route-happy-3", stopId: "stop-gwitturami-boiler", sequence: 3 },
  // H4: wolgok-2-pakwol -> gwitturami-boiler -> nonggong-entrance
  { routeId: "route-happy-4", stopId: "stop-wolgok-2-pakwol", sequence: 1 },
  { routeId: "route-happy-4", stopId: "stop-gwitturami-boiler", sequence: 2 },
  { routeId: "route-happy-4", stopId: "stop-nonggong-entrance", sequence: 3 },
  // H5: gwitturami-boiler -> nonggong-entrance -> public-terminal
  { routeId: "route-happy-5", stopId: "stop-gwitturami-boiler", sequence: 1 },
  { routeId: "route-happy-5", stopId: "stop-nonggong-entrance", sequence: 2 },
  { routeId: "route-happy-5", stopId: "stop-cheongdo-public-terminal", sequence: 3 },
  // H6: nonggong-entrance -> public-terminal -> gumiri -> arae-gumi
  { routeId: "route-happy-6", stopId: "stop-nonggong-entrance", sequence: 1 },
  { routeId: "route-happy-6", stopId: "stop-cheongdo-public-terminal", sequence: 2 },
  { routeId: "route-happy-6", stopId: "stop-gumiri", sequence: 3 },
  { routeId: "route-happy-6", stopId: "stop-arae-gumi", sequence: 4 },
];

/**
 * Raw mock sighting records. We carry the underlying `reporterId` here (rather
 * than a `BusSighting.reporterLabel`) because the label is a server-side
 * derivation and any consumer that wants the `BusSighting` shape should run it
 * through `reporterLabel()` from `server/api/busArchive.ts` (or the mock-mode
 * equivalent). This keeps the salt rotation contract intact: the fixture has
 * no idea what the current salt is.
 *
 * Timestamps are anchored to 2026-05-22T09:00:00Z so that the relative
 * "X minutes ago" formatting in tests is deterministic.
 */
export type MockBusSightingRaw = {
  id: string;
  routeId: string;
  stopId: string;
  reporterId: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
};

export const mockBusSightings: MockBusSightingRaw[] = [
  {
    id: "sighting-1",
    routeId: "route-happy-1",
    stopId: "stop-cheongdo-public-terminal",
    reporterId: "me",
    latitude: 35.6474,
    longitude: 128.7338,
    createdAt: "2026-05-22T08:30:00.000Z",
  },
  {
    id: "sighting-2",
    routeId: "route-happy-2",
    stopId: "stop-arae-gumi",
    reporterId: "author-1",
    latitude: 35.6501,
    longitude: 128.7370,
    createdAt: "2026-05-22T08:55:00.000Z",
  },
  {
    id: "sighting-3",
    routeId: "route-happy-3",
    stopId: "stop-wolgok-2-pakwol",
    reporterId: "me",
    latitude: 35.6480,
    longitude: 128.7390,
    createdAt: "2026-05-22T08:48:00.000Z",
  },
  {
    id: "sighting-4",
    routeId: "route-happy-6",
    stopId: "stop-nonggong-entrance",
    reporterId: "author-1",
    latitude: 35.6520,
    longitude: 128.7385,
    createdAt: "2026-05-22T08:00:00.000Z",
  },
];
