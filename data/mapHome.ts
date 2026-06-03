import type { JobPost, Post } from "../types/domain";

export type CategoryFilter = {
  id: "ride" | "work" | "bus";
  label: string;
};

export const weekdayFilterOptions = [
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
  "일",
] as const;
export type WeekdayFilter = (typeof weekdayFilterOptions)[number];

export const timeFilterOptions = ["오전", "오후"] as const;
export type TimeFilter = (typeof timeFilterOptions)[number];

type MapHomeCoordinate = {
  latitude: number;
  longitude: number;
};

export type BottomNavItem = {
  id: "map" | "bus" | "posts" | "chat" | "profile";
  label: string;
};

export type MapHomePost = {
  id: string;
  detailPostId: string;
  category: CategoryFilter["id"];
  dayFilters: WeekdayFilter[];
  timeFilter: TimeFilter;
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
  marker?: MapHomeCoordinate;
};

const knownPlaceCoordinates: Record<string, MapHomeCoordinate> = {
  "다로리 카페": { latitude: 35.6482, longitude: 128.7358 },
  "다로리 카페 인근": { latitude: 35.6482, longitude: 128.7358 },
  남성현역: { latitude: 35.7153, longitude: 128.7473 },
  청도역: { latitude: 35.6474, longitude: 128.7338 },
  청도명어학원: { latitude: 35.6501, longitude: 128.737 },
};

export const categoryFilters: CategoryFilter[] = [
  { id: "ride", label: "라이드" },
  { id: "work", label: "인력" },
  { id: "bus", label: "버스" },
];

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
    dayFilters: ["화", "목"],
    timeFilter: "오후",
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
    marker: knownPlaceCoordinates["다로리 카페"],
  },
  {
    id: "post-2",
    detailPostId: "job-1",
    category: "work",
    dayFilters: ["화", "목"],
    timeFilter: "오후",
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
    dayFilters: ["화", "목"],
    timeFilter: "오전",
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
    dayFilters: ["수"],
    timeFilter: "오전",
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
    dayFilters: ["수"],
    timeFilter: "오후",
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
    marker: knownPlaceCoordinates["남성현역"],
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
        dayFilters: toWeekdayFilters(post.days),
        timeFilter: toTimeFilter(post.startTime),
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

    const postWithCoordinate = post as typeof post & {
      departureCoordinate?: MapHomeCoordinate;
    };

    return {
      id: `live-${post.id}`,
      detailPostId: post.id,
      category: "ride",
      dayFilters: toWeekdayFilters(post.days),
      timeFilter: toTimeFilter(post.startTime),
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
      marker:
        postWithCoordinate.departureCoordinate ??
        resolveKnownPlaceCoordinate(post.departure),
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

function toWeekdayFilters(days: readonly string[]): WeekdayFilter[] {
  return days.filter((day): day is WeekdayFilter =>
    weekdayFilterOptions.includes(day as WeekdayFilter),
  );
}

function resolveKnownPlaceCoordinate(
  place: string,
): MapHomeCoordinate | undefined {
  const placeName = place.trim();
  const exactCoordinate = knownPlaceCoordinates[placeName];

  if (exactCoordinate) {
    return exactCoordinate;
  }

  const matchedPlaceName = Object.keys(knownPlaceCoordinates).find((knownPlace) =>
    placeName.includes(knownPlace),
  );

  return matchedPlaceName ? knownPlaceCoordinates[matchedPlaceName] : undefined;
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
