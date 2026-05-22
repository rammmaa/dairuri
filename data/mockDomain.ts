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
  nickname: "다로리인",
  realName: "하람",
  phone: "010-0000-0000",
  email: "test@example.com",
  area: "남성현역",
  temperature: 40.6,
  driverType: "driver",
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
  nickname: "우리마이사랑해",
  phone: "010-1234-5678",
  area: "프로필 보기",
  temperature: 80,
  driverType: "driver",
  vehicle: {
    plateNumber: "357나2703",
    modelName: "토요타 SUV",
    images: ["https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=420"],
  },
};

export const mockPosts: Post[] = [
  {
    id: "job-1",
    type: "job",
    title: "‘청도감 학원’ 함께 다니면서 알바하실 분 구해요",
    body:
      "우리 아이와 같이 등원해주실 분을 찾고 있어요. 같은 방향이면 부담 없이 지원해주세요.",
    author: mockAuthor,
    imageUrls: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=720"],
    liked: true,
    status: "open",
    createdAt: "2026-05-14T08:20:00.000Z",
    placeName: "청도명어학원",
    placeAddress: "경북 청도군 중앙로 12",
    days: ["화", "목"],
    startTime: "18:00",
    endTime: "20:00",
    wageType: "hourly",
    wageAmount: 10000,
    jobCategory: "라이딩 교육",
  },
  {
    id: "carpool-1",
    type: "carpool",
    title: "‘청도감 학원’ 함께 다니실 사람 구해요",
    body:
      "평일 저녁에 청도감 학원 방향으로 이동합니다. 조용히 이동하는 편이고 시간은 정확히 맞춰요.",
    author: mockAuthor,
    imageUrls: ["https://images.unsplash.com/photo-1549924231-f129b911e442?w=720"],
    liked: false,
    status: "open",
    createdAt: "2026-05-14T07:10:00.000Z",
    departure: "다로리 카페",
    destination: "청도명어학원",
    days: ["화", "목"],
    startTime: "16:00",
    endTime: "17:00",
    price: 3000,
    seats: 3,
  },
];

export const mockApplications: Application[] = [
  {
    id: "application-1",
    postId: "carpool-1",
    applicant: mockMe,
    intro:
      "시간 약속을 잘 지키고 같은 방향으로 자주 이동합니다. 조용히 이동하는 편이라 부담 없으실 거예요.",
    status: "pending",
    createdAt: "2026-05-14T09:00:00.000Z",
  },
];

export const mockChatRooms: ChatRoom[] = [
  {
    id: "room-1",
    title: "부릉팟",
    subtitle: "남성현역 > 청도명어학원 / 화, 목 16:00",
    participants: [mockMe, mockAuthor],
    postId: "carpool-1",
    lastMessage: "오늘 4시 20분 정문 앞에서 만나요!",
    unreadCount: 3,
  },
  {
    id: "room-2",
    title: "다로리 카페 같이 가요",
    subtitle: "다로리 카페 / 알바 출근",
    participants: [mockMe, mockAuthor],
    postId: "job-1",
    lastMessage: "내일도 같은 시간에 출발하면 될까요?",
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
// Stop coordinates are placeholder values anchored near the Darori village
// area (~35.65 N, 128.73 E) and chosen so that the prototype's stop spacing
// (~400-600 m) roughly matches the 300 m snap radius. They are NOT surveyed.
//
// TODO(field-survey): replace these coordinates with measured values once a
//                     Darori field survey provides them. Do NOT change the
//                     002_bus_archive migration; only update this fixture and
//                     server/db/seedData.ts which derives from it.

export const mockBusRoutes: BusRoute[] = [
  {
    id: "route-d-01",
    code: "D-01",
    name: "다이루리 순환",
    color: "#22C55E",
  },
  {
    id: "route-d-03",
    code: "D-03",
    name: "역 앞 셔틀",
    color: "#2563EB",
  },
  {
    id: "route-d-05",
    code: "D-05",
    name: "학원 라인",
    color: "#F97316",
  },
];

export const mockBusStops: BusStop[] = [
  { id: "stop-darori-cafe", name: "다로리 카페", latitude: 35.6474, longitude: 128.7338 },
  { id: "stop-darori-station-2", name: "다로리역 2번 출구", latitude: 35.6492, longitude: 128.7355 },
  { id: "stop-central", name: "중앙 정류장", latitude: 35.6501, longitude: 128.7370 },
  { id: "stop-community-center", name: "커뮤니티 센터", latitude: 35.6480, longitude: 128.7390 },
  { id: "stop-namseonghyeon", name: "남성현역", latitude: 35.6450, longitude: 128.7305 },
  { id: "stop-cheongdo-academy", name: "청도명어학원", latitude: 35.6520, longitude: 128.7385 },
  { id: "stop-health-center", name: "보건소", latitude: 35.6488, longitude: 128.7325 },
  { id: "stop-west-village", name: "서마을 입구", latitude: 35.6510, longitude: 128.7300 },
];

export type MockBusRouteStop = {
  routeId: string;
  stopId: string;
  sequence: number;
};

export const mockBusRouteStops: MockBusRouteStop[] = [
  // D-01 loop: cafe -> central -> community -> health (loop start)
  { routeId: "route-d-01", stopId: "stop-darori-cafe", sequence: 1 },
  { routeId: "route-d-01", stopId: "stop-central", sequence: 2 },
  { routeId: "route-d-01", stopId: "stop-community-center", sequence: 3 },
  { routeId: "route-d-01", stopId: "stop-health-center", sequence: 4 },
  // D-03 station shuttle: station-2 -> central -> community
  { routeId: "route-d-03", stopId: "stop-darori-station-2", sequence: 1 },
  { routeId: "route-d-03", stopId: "stop-central", sequence: 2 },
  { routeId: "route-d-03", stopId: "stop-community-center", sequence: 3 },
  // D-05 academy line: cafe -> academy -> namseonghyeon -> station-2
  { routeId: "route-d-05", stopId: "stop-darori-cafe", sequence: 1 },
  { routeId: "route-d-05", stopId: "stop-cheongdo-academy", sequence: 2 },
  { routeId: "route-d-05", stopId: "stop-namseonghyeon", sequence: 3 },
  { routeId: "route-d-05", stopId: "stop-darori-station-2", sequence: 4 },
];

/**
 * Raw mock sighting records. We carry the underlying `reporterId` here (rather
 * than a `BusSighting.reporterLabel`) because the label is a server-side
 * derivation and any consumer that wants the `BusSighting` shape should run it
 * through `reporterLabel()` from `server/api/busArchive.ts` (or the mock-mode
 * equivalent). This keeps the salt rotation contract intact: the fixture has
 * no idea what the current salt is.
 *
 * Timestamps are anchored to 2026-05-22T09:00:00Z so that "X minutes ago"
 * relative formatting in tests is deterministic.
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
    routeId: "route-d-01",
    stopId: "stop-darori-cafe",
    reporterId: "me",
    latitude: 35.6474,
    longitude: 128.7338,
    createdAt: "2026-05-22T08:30:00.000Z",
  },
  {
    id: "sighting-2",
    routeId: "route-d-03",
    stopId: "stop-darori-station-2",
    reporterId: "author-1",
    latitude: 35.6492,
    longitude: 128.7355,
    createdAt: "2026-05-22T08:55:00.000Z",
  },
  {
    id: "sighting-3",
    routeId: "route-d-01",
    stopId: "stop-central",
    reporterId: "me",
    latitude: 35.6501,
    longitude: 128.7370,
    createdAt: "2026-05-22T08:48:00.000Z",
  },
  {
    id: "sighting-4",
    routeId: "route-d-03",
    stopId: "stop-community-center",
    reporterId: "author-1",
    latitude: 35.6480,
    longitude: 128.7390,
    createdAt: "2026-05-22T08:52:00.000Z",
  },
  {
    id: "sighting-5",
    routeId: "route-d-05",
    stopId: "stop-cheongdo-academy",
    reporterId: "me",
    latitude: 35.6520,
    longitude: 128.7385,
    createdAt: "2026-05-22T08:00:00.000Z",
  },
];
