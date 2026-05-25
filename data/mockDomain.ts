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
// The six routes follow the Figma flow user shared on 2026-05-23: "행복버스
// 1호선" through "행복버스 6호선", identified visually by a 1-to-6 pager and
// not by hue. All routes therefore share a single mint color; the numeric
// position is what distinguishes them.
//
// The six stop names come from the Figma frame the user transcribed on
// 2026-05-26. Stop coordinates are placeholder values anchored near the
// Darori village area (~35.65 N, 128.73 E) and chosen so that stop spacing
// roughly matches the 300 m snap radius. The coordinates are NOT surveyed.
//
// TODO(field-survey): replace these coordinates with measured values once a
//                     Darori field survey provides them. Do NOT change the
//                     002_bus_archive migration; only update this fixture and
//                     server/db/seedData.ts which derives from it.

const HAPPY_BUS_COLOR = "#00A866"; // mirrors colors.mintDark in the design tokens

export const mockBusRoutes: BusRoute[] = [
  { id: "route-happy-1", code: "H1", name: "행복버스 1호선", color: HAPPY_BUS_COLOR },
  { id: "route-happy-2", code: "H2", name: "행복버스 2호선", color: HAPPY_BUS_COLOR },
  { id: "route-happy-3", code: "H3", name: "행복버스 3호선", color: HAPPY_BUS_COLOR },
  { id: "route-happy-4", code: "H4", name: "행복버스 4호선", color: HAPPY_BUS_COLOR },
  { id: "route-happy-5", code: "H5", name: "행복버스 5호선", color: HAPPY_BUS_COLOR },
  { id: "route-happy-6", code: "H6", name: "행복버스 6호선", color: HAPPY_BUS_COLOR },
];

export const mockBusStops: BusStop[] = [
  { id: "stop-koaru-bluepin", name: "청도 코아루블루핀", latitude: 35.6474, longitude: 128.7338 },
  { id: "stop-cheongdo-office", name: "청도군청", latitude: 35.6492, longitude: 128.7355 },
  { id: "stop-cheongdo-terminal", name: "청도 버스 터미널", latitude: 35.6501, longitude: 128.7370 },
  { id: "stop-seongjo-apt", name: "성조 아파트 앞", latitude: 35.6480, longitude: 128.7390 },
  { id: "stop-bumin-apt", name: "부민 아파트", latitude: 35.6450, longitude: 128.7305 },
  { id: "stop-kindergarten", name: "어린이집", latitude: 35.6520, longitude: 128.7385 },
];

export type MockBusRouteStop = {
  routeId: string;
  stopId: string;
  sequence: number;
};

// Each route visits three or four stops. The stops are intentionally shared
// across multiple routes so junction tie-breaks in inferRouteAndStop have a
// realistic geometry to exercise. Sequence numbers are 1-based per route.
export const mockBusRouteStops: MockBusRouteStop[] = [
  // H1: koaru-bluepin -> cheongdo-office -> cheongdo-terminal
  { routeId: "route-happy-1", stopId: "stop-koaru-bluepin", sequence: 1 },
  { routeId: "route-happy-1", stopId: "stop-cheongdo-office", sequence: 2 },
  { routeId: "route-happy-1", stopId: "stop-cheongdo-terminal", sequence: 3 },
  // H2: visits every stop as a stadium loop. Matches the Figma "행복버스
  //     2호선" stop-selection frame, where the user can choose any of the
  //     six stops along the route. Sequence order traces the stadium clockwise:
  //     top row koaru-bluepin -> cheongdo-office -> cheongdo-terminal, then
  //     bottom row seongjo-apt -> bumin-apt -> kindergarten.
  { routeId: "route-happy-2", stopId: "stop-koaru-bluepin", sequence: 1 },
  { routeId: "route-happy-2", stopId: "stop-cheongdo-office", sequence: 2 },
  { routeId: "route-happy-2", stopId: "stop-cheongdo-terminal", sequence: 3 },
  { routeId: "route-happy-2", stopId: "stop-seongjo-apt", sequence: 4 },
  { routeId: "route-happy-2", stopId: "stop-bumin-apt", sequence: 5 },
  { routeId: "route-happy-2", stopId: "stop-kindergarten", sequence: 6 },
  // H3: cheongdo-terminal -> seongjo-apt -> bumin-apt
  { routeId: "route-happy-3", stopId: "stop-cheongdo-terminal", sequence: 1 },
  { routeId: "route-happy-3", stopId: "stop-seongjo-apt", sequence: 2 },
  { routeId: "route-happy-3", stopId: "stop-bumin-apt", sequence: 3 },
  // H4: seongjo-apt -> bumin-apt -> kindergarten
  { routeId: "route-happy-4", stopId: "stop-seongjo-apt", sequence: 1 },
  { routeId: "route-happy-4", stopId: "stop-bumin-apt", sequence: 2 },
  { routeId: "route-happy-4", stopId: "stop-kindergarten", sequence: 3 },
  // H5: bumin-apt -> kindergarten -> koaru-bluepin
  { routeId: "route-happy-5", stopId: "stop-bumin-apt", sequence: 1 },
  { routeId: "route-happy-5", stopId: "stop-kindergarten", sequence: 2 },
  { routeId: "route-happy-5", stopId: "stop-koaru-bluepin", sequence: 3 },
  // H6: kindergarten -> koaru-bluepin -> cheongdo-office -> cheongdo-terminal
  { routeId: "route-happy-6", stopId: "stop-kindergarten", sequence: 1 },
  { routeId: "route-happy-6", stopId: "stop-koaru-bluepin", sequence: 2 },
  { routeId: "route-happy-6", stopId: "stop-cheongdo-office", sequence: 3 },
  { routeId: "route-happy-6", stopId: "stop-cheongdo-terminal", sequence: 4 },
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
    stopId: "stop-koaru-bluepin",
    reporterId: "me",
    latitude: 35.6474,
    longitude: 128.7338,
    createdAt: "2026-05-22T08:30:00.000Z",
  },
  {
    id: "sighting-2",
    routeId: "route-happy-2",
    stopId: "stop-cheongdo-terminal",
    reporterId: "author-1",
    latitude: 35.6501,
    longitude: 128.7370,
    createdAt: "2026-05-22T08:55:00.000Z",
  },
  {
    id: "sighting-3",
    routeId: "route-happy-3",
    stopId: "stop-seongjo-apt",
    reporterId: "me",
    latitude: 35.6480,
    longitude: 128.7390,
    createdAt: "2026-05-22T08:48:00.000Z",
  },
  {
    id: "sighting-4",
    routeId: "route-happy-6",
    stopId: "stop-kindergarten",
    reporterId: "author-1",
    latitude: 35.6520,
    longitude: 128.7385,
    createdAt: "2026-05-22T08:00:00.000Z",
  },
];
