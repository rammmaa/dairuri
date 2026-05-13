export type BottomTabId = "map" | "bus" | "post" | "chat" | "profile";

export interface BottomTab {
  id: BottomTabId;
  label: string;
  icon: string;
}

export interface ServiceFeature {
  id: "ride" | "bus" | "job";
  title: string;
  description: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RideListing {
  id: string;
  type: "ride";
  title: string;
  departureName: string;
  destinationName: string;
  dayLabel: string;
  departureTime: string;
  seatsLeft: number;
  location: GeoPoint;
}

export interface JobListing {
  id: string;
  type: "job";
  title: string;
  placeName: string;
  payLabel: string;
  scheduleLabel: string;
}

export interface BusReportInput {
  routeNumber: string;
  placeName: string;
  lat: number;
  lng: number;
}

export interface BusReport extends BusReportInput {
  id: string;
  location: GeoPoint;
  observedAt: string;
}

export const bottomTabs: BottomTab[] = [
  { id: "map", label: "지도", icon: "map" },
  { id: "bus", label: "버스", icon: "truck" },
  { id: "post", label: "모집글", icon: "plus-square" },
  { id: "chat", label: "채팅", icon: "message-circle" },
  { id: "profile", label: "프로필", icon: "user" },
];

export const serviceFeatures: ServiceFeature[] = [
  {
    id: "ride",
    title: "정기 라이딩",
    description: "동네 거점을 기준으로 반복 이동 약속을 모집합니다.",
  },
  {
    id: "bus",
    title: "버스 아카이빙",
    description: "방금 본 버스 정보를 주민들이 빠르게 남깁니다.",
  },
  {
    id: "job",
    title: "일자리",
    description: "지역 소상공인과 주민을 연결하는 짧은 모집글을 다룹니다.",
  },
];

export const sampleRideListings: RideListing[] = [
  {
    id: "ride-cafe-weekly",
    type: "ride",
    title: "다로리 카페 매주 같이 가실 분 구해요",
    departureName: "다로리 카페",
    destinationName: "청도역",
    dayLabel: "매주 월, 수",
    departureTime: "오전 9:20",
    seatsLeft: 2,
    location: { lat: 35.7001, lng: 128.7342 },
  },
  {
    id: "ride-market-saturday",
    type: "ride",
    title: "토요일 장 보러 같이 가요",
    departureName: "읍내 정류장",
    destinationName: "청도시장",
    dayLabel: "토요일",
    departureTime: "오전 10:00",
    seatsLeft: 1,
    location: { lat: 35.6988, lng: 128.7311 },
  },
];

export const sampleJobListings: JobListing[] = [
  {
    id: "job-cafe-helper",
    type: "job",
    title: "주말 카페 보조 구해요",
    placeName: "다로리 카페",
    payLabel: "시급 12,000원",
    scheduleLabel: "토, 일 11:00-15:00",
  },
];
