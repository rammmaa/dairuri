export type CategoryFilter = {
  id: "ride" | "work" | "bus";
  label: string;
};

export type BottomNavItem = {
  id: "map" | "bus" | "posts" | "chat" | "profile";
  label: string;
};

export type MapHomePost = {
  id: string;
  detailPostId: string;
  category: CategoryFilter["id"];
  dateFilter: "오늘" | "내일";
  timeFilter: "오전" | "오후";
  departurePlace: "남성현역" | "다로리 카페";
  createdMinutesAgo: number;
  author: string;
  title: string;
  schedule: string;
  purpose: string;
  duration: string;
  originLabel: string;
  originName: string;
  createdAgo: string;
  liked: boolean;
};

export const categoryFilters: CategoryFilter[] = [
  { id: "ride", label: "라이드" },
  { id: "work", label: "알바" },
  { id: "bus", label: "버스" },
];

export const bottomSheetFilters = ["날짜", "시간", "출발 장소"] as const;

export const bottomNavItems: BottomNavItem[] = [
  { id: "map", label: "지도" },
  { id: "bus", label: "버스" },
  { id: "posts", label: "모집글" },
  { id: "chat", label: "채팅" },
  { id: "profile", label: "프로필" },
];

export const mapHomePosts: MapHomePost[] = [
  {
    id: "post-1",
    detailPostId: "carpool-1",
    category: "ride",
    dateFilter: "오늘",
    timeFilter: "오후",
    departurePlace: "남성현역",
    createdMinutesAgo: 35,
    author: "다로리인",
    title: "다로리 카페 매주 같이 가실 분 구해요",
    schedule: "화 - 목 ❘ 16:00",
    purpose: "라이드",
    duration: "최대한 오래",
    originLabel: "출발지",
    originName: "다로리 카페",
    createdAgo: "35분 전",
    liked: true,
  },
  {
    id: "post-2",
    detailPostId: "job-1",
    category: "work",
    dateFilter: "오늘",
    timeFilter: "오후",
    departurePlace: "남성현역",
    createdMinutesAgo: 60,
    author: "다로리인",
    title: "다로리 카페 매주 같이 가실 분 구해요",
    schedule: "화 - 목 ❘ 16:00",
    purpose: "알바 출근",
    duration: "최대한 오래",
    originLabel: "출발지",
    originName: "남성현역",
    createdAgo: "1시간 전",
    liked: false,
  },
  {
    id: "post-3",
    detailPostId: "carpool-1",
    category: "bus",
    dateFilter: "오늘",
    timeFilter: "오전",
    departurePlace: "다로리 카페",
    createdMinutesAgo: 120,
    author: "다로리인",
    title: "다로리 카페 매주 같이 가실 분 구해요",
    schedule: "화 - 목 ❘ 09:00",
    purpose: "버스 동행",
    duration: "등교 시간",
    originLabel: "출발지",
    originName: "다로리 카페",
    createdAgo: "2시간 전",
    liked: false,
  },
  {
    id: "post-4",
    detailPostId: "job-1",
    category: "work",
    dateFilter: "내일",
    timeFilter: "오전",
    departurePlace: "다로리 카페",
    createdMinutesAgo: 240,
    author: "다로리인",
    title: "다로리 카페 매주 같이 가실 분 구해요",
    schedule: "수 ❘ 10:00",
    purpose: "알바 출근",
    duration: "오전 근무",
    originLabel: "출발지",
    originName: "다로리 카페",
    createdAgo: "4시간 전",
    liked: false,
  },
  {
    id: "post-5",
    detailPostId: "carpool-1",
    category: "ride",
    dateFilter: "내일",
    timeFilter: "오후",
    departurePlace: "남성현역",
    createdMinutesAgo: 480,
    author: "다로리인",
    title: "다로리 카페 매주 같이 가실 분 구해요",
    schedule: "수 ❘ 18:30",
    purpose: "라이드",
    duration: "퇴근 시간",
    originLabel: "출발지",
    originName: "남성현역",
    createdAgo: "8시간 전",
    liked: false,
  },
];
