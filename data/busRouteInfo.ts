// Per-route metadata for the route-info screen. Source: namu.wiki Cheongdo
// Happy Bus, transcribed by the user 2026-06-06. All routes run 3 times a day
// (3 runs/day), operated by Cheongdo Bus with 2 shared vehicles.
export type BusRouteInfo = {
  routeId: string;
  origin: string;
  terminus: string;
  firstBus: string;
  lastBus: string;
  runsPerDay: string;
  operator: string;
  vehicles: string;
};

const COMMON = {
  runsPerDay: "1일 3회",
  operator: "청도버스",
  vehicles: "통합 2대",
};

export const busRouteInfo: Record<string, BusRouteInfo> = {
  "route-happy-1": {
    routeId: "route-happy-1",
    origin: "청도공용버스터미널 (청도읍 고수리)",
    terminus: "청도공용버스터미널 (청도읍 고수리)",
    firstBus: "07:50",
    lastBus: "16:50",
    ...COMMON,
  },
  "route-happy-2": {
    routeId: "route-happy-2",
    origin: "청도공용버스터미널 (청도읍 고수리)",
    terminus: "범곡1리복지회관 (화양읍 범곡1리)",
    firstBus: "08:30",
    lastBus: "18:00",
    ...COMMON,
  },
  "route-happy-3": {
    routeId: "route-happy-3",
    origin: "청도공용버스터미널 (청도읍 고수리)",
    terminus: "신봉리(홍도) (화양읍 신봉리)",
    firstBus: "06:50",
    lastBus: "15:30",
    ...COMMON,
  },
  "route-happy-4": {
    routeId: "route-happy-4",
    origin: "청도공용버스터미널 (청도읍 고수리)",
    terminus: "동곡공용버스터미널 (금천면 동곡리)",
    firstBus: "07:20",
    lastBus: "16:30",
    ...COMMON,
  },
  "route-happy-5": {
    routeId: "route-happy-5",
    origin: "동곡공용버스터미널 (금천면 동곡리)",
    terminus: "삼계 (운문면 삼계리)",
    firstBus: "08:10",
    lastBus: "17:20",
    ...COMMON,
  },
  "route-happy-6": {
    routeId: "route-happy-6",
    origin: "청도공용버스터미널 (청도읍 고수리)",
    terminus: "안송읍 (청도읍 송읍리)",
    firstBus: "06:50",
    lastBus: "15:40",
    ...COMMON,
  },
};
