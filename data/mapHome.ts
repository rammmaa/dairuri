import type { JobPost, Post } from "../types/domain";

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
  { id: "work", label: "인력" },
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
    title: "농촌 일손과 카페 보조 도울 수 있어요",
    schedule: "화 - 목 ❘ 16:00",
    purpose: "가능 업무",
    duration: "최대한 오래",
    originLabel: "활동 가능 지역",
    originName: "다로리 카페 인근",
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
    title: "주말 오전 아이 돌봄과 매장 보조 가능해요",
    schedule: "수 ❘ 10:00",
    purpose: "가능 업무",
    duration: "오전 가능",
    originLabel: "활동 가능 지역",
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

export function mapDomainPostsToMapHomePosts(posts: Post[]): MapHomePost[] {
  return posts.map((post, index) => {
    const createdMinutesAgo = getCreatedMinutesAgo(post.createdAt, index);
    const schedule = formatSchedule(post.days, post.startTime);

    if (post.type === "job") {
      return {
        id: `live-${post.id}`,
        detailPostId: post.id,
        category: "work",
        dateFilter: "오늘",
        timeFilter: toTimeFilter(post.startTime),
        departurePlace: toDeparturePlace(post.placeName),
        createdMinutesAgo,
        author: post.author.nickname,
        title: post.title,
        schedule,
        purpose: formatResourcePurpose(post),
        duration: post.availabilityNote ?? formatTimeRange(post.startTime, post.endTime),
        originLabel: "활동 가능 지역",
        originName: post.placeName,
        createdAgo: formatCreatedAgo(createdMinutesAgo),
        liked: post.liked,
      };
    }

    return {
      id: `live-${post.id}`,
      detailPostId: post.id,
      category: "ride",
      dateFilter: "오늘",
      timeFilter: toTimeFilter(post.startTime),
      departurePlace: toDeparturePlace(post.departure),
      createdMinutesAgo,
      author: post.author.nickname,
      title: post.title,
      schedule,
      purpose: "라이드",
      duration: post.endTime ? formatTimeRange(post.startTime, post.endTime) : "시간 협의",
      originLabel: "출발지",
      originName: post.departure,
      createdAgo: formatCreatedAgo(createdMinutesAgo),
      liked: post.liked,
    };
  });
}

function formatResourcePurpose(post: JobPost) {
  if (post.availableTasks && post.availableTasks.length > 0) {
    return post.availableTasks.join(" · ");
  }

  return post.jobCategory ?? "가능 업무";
}

function formatSchedule(days: readonly string[], startTime: string) {
  const dayLabel = days.length > 0 ? days.join(" - ") : "요일 협의";

  return `${dayLabel} ❘ ${startTime || "시간 협의"}`;
}

function formatTimeRange(startTime: string, endTime?: string) {
  if (!startTime && !endTime) {
    return "시간 협의";
  }

  return endTime ? `${startTime} - ${endTime}` : startTime;
}

function toTimeFilter(startTime: string): MapHomePost["timeFilter"] {
  const hour = Number(startTime.split(":")[0]);

  return Number.isFinite(hour) && hour < 12 ? "오전" : "오후";
}

function toDeparturePlace(place: string): MapHomePost["departurePlace"] {
  return place.includes("남성현역") ? "남성현역" : "다로리 카페";
}

function getCreatedMinutesAgo(createdAt: string, fallbackIndex: number) {
  const createdTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdTime)) {
    return fallbackIndex + 1;
  }

  return Math.max(1, Math.round((Date.now() - createdTime) / 60000));
}

function formatCreatedAgo(minutes: number) {
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  return `${Math.round(hours / 24)}일 전`;
}
