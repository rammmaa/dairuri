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
// The stop names and route compositions are the real Cheongdo Happy Bus data
// (source: namu.wiki, transcribed by the user 2026-06-06; see
// docs/superpowers/specs/2026-06-06-bus-archive-real-route-data.md). Coordinates
// for the town and terminal anchors are geocoded from OpenStreetMap Nominatim;
// the small rural stops between anchors are interpolated along each route, so
// anchors are real geography and intermediate stops are approximate.
//
// TODO(field-survey): replace the interpolated coordinates with measured values
//                     when a survey provides them. Do NOT change the
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
  // Shared anchors / terminals (real coordinates from OSM Nominatim).
  { id: "stop-cheongdo-public-terminal", name: "청도공용버스터미널", latitude: 35.6413, longitude: 128.7464 },
  { id: "stop-cheongdo-market", name: "청도시장", latitude: 35.6420, longitude: 128.7440 },
  { id: "stop-donggok-terminal", name: "동곡공용버스터미널", latitude: 35.6993, longitude: 128.8823 },
  // H1 loop near 청도읍 (interpolated around the terminal).
  { id: "stop-gumiri", name: "구미리", latitude: 35.6435, longitude: 128.7510 },
  { id: "stop-arae-gumi", name: "아랫구미", latitude: 35.6450, longitude: 128.7548 },
  { id: "stop-wolgok-2-pakwol", name: "월곡2리(박월)", latitude: 35.6470, longitude: 128.7585 },
  { id: "stop-gwitturami-boiler", name: "귀뚜라미보일러", latitude: 35.6495, longitude: 128.7560 },
  { id: "stop-nonggong-entrance", name: "농공단지 입구", latitude: 35.6510, longitude: 128.7520 },
  { id: "stop-wolgok-1-hall", name: "월곡1리 마을회관", latitude: 35.6500, longitude: 128.7480 },
  { id: "stop-dajeong", name: "다정다감", latitude: 35.6470, longitude: 128.7470 },
  { id: "stop-daean-apt", name: "대안아파트", latitude: 35.6440, longitude: 128.7475 },
  // H2/H3 shared (청도읍 -> 화양 범곡, interpolated to the Beomgok anchor).
  { id: "stop-seongjo-apt", name: "성조아파트", latitude: 35.6400, longitude: 128.7420 },
  { id: "stop-bumin-apt", name: "부민아파트", latitude: 35.6388, longitude: 128.7385 },
  { id: "stop-county-office", name: "청도군청 뒤", latitude: 35.6378, longitude: 128.7360 },
  { id: "stop-koaru-apt", name: "코아루아파트", latitude: 35.6362, longitude: 128.7335 },
  { id: "stop-beomgok-humansia", name: "범곡휴먼시아아파트", latitude: 35.6352, longitude: 128.7320 },
  { id: "stop-beomgok-1-welfare", name: "범곡1리복지회관", latitude: 35.6346, longitude: 128.7314 },
  // H3 extras (청도읍 -> 화양 신봉리, interpolated to the Sinbong anchor).
  { id: "stop-chukhyeop", name: "축협", latitude: 35.6410, longitude: 128.7415 },
  { id: "stop-beomgok-crossroad", name: "범곡사거리", latitude: 35.6340, longitude: 128.7300 },
  { id: "stop-sports-field", name: "청도공설운동장", latitude: 35.6325, longitude: 128.7270 },
  { id: "stop-dongcheon-ri", name: "동천리", latitude: 35.6318, longitude: 128.7220 },
  { id: "stop-eupseong", name: "청도읍성", latitude: 35.6385, longitude: 128.7150 },
  { id: "stop-hwayang-police", name: "화양파출소", latitude: 35.6360, longitude: 128.7080 },
  { id: "stop-seosang-super", name: "서상슈퍼", latitude: 35.6335, longitude: 128.7040 },
  { id: "stop-sinbong-saeteo", name: "신봉리(새터)", latitude: 35.6320, longitude: 128.7020 },
  { id: "stop-cheongseokgol-farm", name: "청석골농장", latitude: 35.6315, longitude: 128.7010 },
  { id: "stop-sinbong-hongdo", name: "신봉리(홍도)", latitude: 35.6312, longitude: 128.7015 },
  // H4 extras (청도읍 -> 금천 동곡, interpolated to the Donggok anchor).
  { id: "stop-gomtijae", name: "곰티재", latitude: 35.6550, longitude: 128.7650 },
  { id: "stop-sangpyeong", name: "상평", latitude: 35.6680, longitude: 128.7850 },
  { id: "stop-doncchijae-tunnel", name: "돈치재터널", latitude: 35.6800, longitude: 128.8050 },
  { id: "stop-gimjeon-ri", name: "김전리", latitude: 35.6880, longitude: 128.8350 },
  { id: "stop-sajeon-ri", name: "사전리", latitude: 35.6940, longitude: 128.8600 },
  // H5 extras (동곡 -> 운문 삼계, interpolated to the Daecheon / Unmunsa anchors).
  { id: "stop-daecheon-terminal", name: "대천공용여객자동차터미널", latitude: 35.7281, longitude: 128.9205 },
  { id: "stop-ojin", name: "오진", latitude: 35.7050, longitude: 128.9350 },
  { id: "stop-sojin", name: "소진", latitude: 35.6850, longitude: 128.9450 },
  { id: "stop-tongjeom", name: "통점", latitude: 35.6700, longitude: 128.9530 },
  { id: "stop-samgye", name: "삼계", latitude: 35.6600, longitude: 128.9600 },
  // H6 extras (청도읍 -> 송읍, interpolated north of the terminal).
  { id: "stop-riverside-road", name: "강변도로", latitude: 35.6480, longitude: 128.7470 },
  { id: "stop-eup-office", name: "청도읍사무소", latitude: 35.6540, longitude: 128.7510 },
  { id: "stop-singi-bridge", name: "신기교", latitude: 35.6590, longitude: 128.7550 },
  { id: "stop-ansongeup", name: "안송읍", latitude: 35.6620, longitude: 128.7580 },
];

export type MockBusRouteStop = {
  routeId: string;
  stopId: string;
  sequence: number;
};

// Real Cheongdo Happy Bus route compositions (source: namu.wiki, transcribed by
// the user 2026-06-06). Stops are shared across routes where the source lists
// the same place. The terminal that the source shows at both ends of a route
// (H1/H3 etc.) is listed once; the loop is descriptive, not a duplicated row.
// Sequence numbers are 1-based per route.
export const mockBusRouteStops: MockBusRouteStop[] = [
  // H1: loop near 청도읍.
  { routeId: "route-happy-1", stopId: "stop-cheongdo-public-terminal", sequence: 1 },
  { routeId: "route-happy-1", stopId: "stop-gumiri", sequence: 2 },
  { routeId: "route-happy-1", stopId: "stop-arae-gumi", sequence: 3 },
  { routeId: "route-happy-1", stopId: "stop-wolgok-2-pakwol", sequence: 4 },
  { routeId: "route-happy-1", stopId: "stop-gwitturami-boiler", sequence: 5 },
  { routeId: "route-happy-1", stopId: "stop-nonggong-entrance", sequence: 6 },
  { routeId: "route-happy-1", stopId: "stop-wolgok-1-hall", sequence: 7 },
  { routeId: "route-happy-1", stopId: "stop-dajeong", sequence: 8 },
  { routeId: "route-happy-1", stopId: "stop-daean-apt", sequence: 9 },
  // H2: 청도읍 -> 화양 범곡.
  { routeId: "route-happy-2", stopId: "stop-cheongdo-public-terminal", sequence: 1 },
  { routeId: "route-happy-2", stopId: "stop-seongjo-apt", sequence: 2 },
  { routeId: "route-happy-2", stopId: "stop-bumin-apt", sequence: 3 },
  { routeId: "route-happy-2", stopId: "stop-county-office", sequence: 4 },
  { routeId: "route-happy-2", stopId: "stop-koaru-apt", sequence: 5 },
  { routeId: "route-happy-2", stopId: "stop-beomgok-humansia", sequence: 6 },
  { routeId: "route-happy-2", stopId: "stop-beomgok-1-welfare", sequence: 7 },
  // H3: 청도읍 -> 화양 신봉리.
  { routeId: "route-happy-3", stopId: "stop-cheongdo-public-terminal", sequence: 1 },
  { routeId: "route-happy-3", stopId: "stop-cheongdo-market", sequence: 2 },
  { routeId: "route-happy-3", stopId: "stop-chukhyeop", sequence: 3 },
  { routeId: "route-happy-3", stopId: "stop-seongjo-apt", sequence: 4 },
  { routeId: "route-happy-3", stopId: "stop-bumin-apt", sequence: 5 },
  { routeId: "route-happy-3", stopId: "stop-county-office", sequence: 6 },
  { routeId: "route-happy-3", stopId: "stop-koaru-apt", sequence: 7 },
  { routeId: "route-happy-3", stopId: "stop-beomgok-humansia", sequence: 8 },
  { routeId: "route-happy-3", stopId: "stop-beomgok-crossroad", sequence: 9 },
  { routeId: "route-happy-3", stopId: "stop-sports-field", sequence: 10 },
  { routeId: "route-happy-3", stopId: "stop-dongcheon-ri", sequence: 11 },
  { routeId: "route-happy-3", stopId: "stop-eupseong", sequence: 12 },
  { routeId: "route-happy-3", stopId: "stop-hwayang-police", sequence: 13 },
  { routeId: "route-happy-3", stopId: "stop-seosang-super", sequence: 14 },
  { routeId: "route-happy-3", stopId: "stop-sinbong-saeteo", sequence: 15 },
  { routeId: "route-happy-3", stopId: "stop-cheongseokgol-farm", sequence: 16 },
  { routeId: "route-happy-3", stopId: "stop-sinbong-hongdo", sequence: 17 },
  // H4: 청도읍 -> 금천 동곡.
  { routeId: "route-happy-4", stopId: "stop-cheongdo-public-terminal", sequence: 1 },
  { routeId: "route-happy-4", stopId: "stop-gomtijae", sequence: 2 },
  { routeId: "route-happy-4", stopId: "stop-sangpyeong", sequence: 3 },
  { routeId: "route-happy-4", stopId: "stop-doncchijae-tunnel", sequence: 4 },
  { routeId: "route-happy-4", stopId: "stop-gimjeon-ri", sequence: 5 },
  { routeId: "route-happy-4", stopId: "stop-sajeon-ri", sequence: 6 },
  { routeId: "route-happy-4", stopId: "stop-donggok-terminal", sequence: 7 },
  // H5: 동곡 -> 운문 삼계.
  { routeId: "route-happy-5", stopId: "stop-donggok-terminal", sequence: 1 },
  { routeId: "route-happy-5", stopId: "stop-daecheon-terminal", sequence: 2 },
  { routeId: "route-happy-5", stopId: "stop-ojin", sequence: 3 },
  { routeId: "route-happy-5", stopId: "stop-sojin", sequence: 4 },
  { routeId: "route-happy-5", stopId: "stop-tongjeom", sequence: 5 },
  { routeId: "route-happy-5", stopId: "stop-samgye", sequence: 6 },
  // H6: 청도읍 -> 송읍.
  { routeId: "route-happy-6", stopId: "stop-cheongdo-public-terminal", sequence: 1 },
  { routeId: "route-happy-6", stopId: "stop-cheongdo-market", sequence: 2 },
  { routeId: "route-happy-6", stopId: "stop-riverside-road", sequence: 3 },
  { routeId: "route-happy-6", stopId: "stop-eup-office", sequence: 4 },
  { routeId: "route-happy-6", stopId: "stop-singi-bridge", sequence: 5 },
  { routeId: "route-happy-6", stopId: "stop-ansongeup", sequence: 6 },
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
    latitude: 35.6413,
    longitude: 128.7464,
    createdAt: "2026-05-22T08:30:00.000Z",
  },
  {
    id: "sighting-2",
    routeId: "route-happy-2",
    stopId: "stop-bumin-apt",
    reporterId: "author-1",
    latitude: 35.6388,
    longitude: 128.7385,
    createdAt: "2026-05-22T08:55:00.000Z",
  },
  {
    id: "sighting-3",
    routeId: "route-happy-3",
    stopId: "stop-eupseong",
    reporterId: "me",
    latitude: 35.6385,
    longitude: 128.7150,
    createdAt: "2026-05-22T08:48:00.000Z",
  },
  {
    id: "sighting-4",
    routeId: "route-happy-6",
    stopId: "stop-ansongeup",
    reporterId: "author-1",
    latitude: 35.6620,
    longitude: 128.7580,
    createdAt: "2026-05-22T08:00:00.000Z",
  },
];
