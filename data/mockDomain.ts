import type {
  Application,
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
    jobCategory: "인적 자원",
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
    title: "농촌 일손 연락방",
    subtitle: "다로리 카페 인근 / 인적 자원",
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
