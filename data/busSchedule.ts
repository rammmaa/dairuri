// Per-route timetable tables for the route-info screen, matching the 2026-06-06
// Figma "Cheongdo Happy Bus" frames. Routes 1 and 2 use the exact times shown
// frames; routes 3-6 are derived from the real first/last departures (outbound
// and inbound) with the middle run interpolated and a 20-minute run time added
// arrivals. Source: namu.wiki Cheongdo Happy Bus.
export type ScheduleRow = {
  label: "기점" | "종점";
  stop: string;
  times: [string, string, string];
};

export type BusScheduleEntry = {
  routeId: string;
  category: "순환선" | "일방향선";
  categoryNote: string;
  segment: string;
  durationNote: string;
  rows: ScheduleRow[];
};

export const busSchedule: Record<string, BusScheduleEntry> = {
  "route-happy-1": {
    routeId: "route-happy-1",
    category: "순환선",
    categoryNote: "1일 3회 순환 운행",
    segment: "청도공용버스터미널 ~ 청도읍 월곡리 구간",
    durationNote: "운행시간 20분 소요",
    rows: [
      { label: "기점", stop: "청도공용버스터미널", times: ["07:50", "11:50", "16:50"] },
      { label: "종점", stop: "청도공용버스터미널", times: ["08:10", "12:10", "17:10"] },
    ],
  },
  "route-happy-2": {
    routeId: "route-happy-2",
    category: "일방향선",
    categoryNote: "1일 3회 왕복 운행",
    segment: "청도공용버스터미널 ~ 화양읍 범곡1리 구간",
    durationNote: "운행시간 20분 소요",
    rows: [
      { label: "기점", stop: "청도공용버스터미널", times: ["08:30", "13:00", "18:00"] },
      { label: "종점", stop: "범곡1리복지회관", times: ["08:50", "13:20", "18:20"] },
      { label: "기점", stop: "범곡1리복지회관", times: ["08:50", "13:20", "18:20"] },
      { label: "종점", stop: "청도공용버스터미널", times: ["09:10", "13:40", "18:40"] },
    ],
  },
  "route-happy-3": {
    routeId: "route-happy-3",
    category: "일방향선",
    categoryNote: "1일 3회 왕복 운행",
    segment: "청도공용버스터미널 ~ 화양읍 신봉리 구간",
    durationNote: "운행시간 20분 소요",
    rows: [
      { label: "기점", stop: "청도공용버스터미널", times: ["06:50", "11:10", "15:30"] },
      { label: "종점", stop: "신봉리(홍도)", times: ["07:10", "11:30", "15:50"] },
      { label: "기점", stop: "신봉리(홍도)", times: ["07:20", "11:40", "16:00"] },
      { label: "종점", stop: "청도공용버스터미널", times: ["07:40", "12:00", "16:20"] },
    ],
  },
  "route-happy-4": {
    routeId: "route-happy-4",
    category: "일방향선",
    categoryNote: "1일 3회 왕복 운행",
    segment: "청도공용버스터미널 ~ 금천면 동곡 구간",
    durationNote: "운행시간 20분 소요",
    rows: [
      { label: "기점", stop: "청도공용버스터미널", times: ["07:20", "11:55", "16:30"] },
      { label: "종점", stop: "동곡공용버스터미널", times: ["07:40", "12:15", "16:50"] },
      { label: "기점", stop: "동곡공용버스터미널", times: ["09:40", "14:10", "18:40"] },
      { label: "종점", stop: "청도공용버스터미널", times: ["10:00", "14:30", "19:00"] },
    ],
  },
  "route-happy-5": {
    routeId: "route-happy-5",
    category: "일방향선",
    categoryNote: "1일 3회 왕복 운행",
    segment: "동곡공용버스터미널 ~ 운문면 삼계 구간",
    durationNote: "운행시간 20분 소요",
    rows: [
      { label: "기점", stop: "동곡공용버스터미널", times: ["08:10", "12:45", "17:20"] },
      { label: "종점", stop: "삼계", times: ["08:30", "13:05", "17:40"] },
      { label: "기점", stop: "삼계", times: ["08:50", "13:25", "18:00"] },
      { label: "종점", stop: "동곡공용버스터미널", times: ["09:10", "13:45", "18:20"] },
    ],
  },
  "route-happy-6": {
    routeId: "route-happy-6",
    category: "일방향선",
    categoryNote: "1일 3회 왕복 운행",
    segment: "청도공용버스터미널 ~ 청도읍 송읍 구간",
    durationNote: "운행시간 20분 소요",
    rows: [
      { label: "기점", stop: "청도공용버스터미널", times: ["06:50", "11:15", "15:40"] },
      { label: "종점", stop: "안송읍", times: ["07:10", "11:35", "16:00"] },
      { label: "기점", stop: "안송읍", times: ["07:00", "11:25", "15:50"] },
      { label: "종점", stop: "청도공용버스터미널", times: ["07:20", "11:45", "16:10"] },
    ],
  },
};

// Contact info shown at the bottom of the route-info page (from the Figma frame).
export const busOperatorContacts = [
  "(주)청도버스 (청도 054-371-5100)",
  "(주)인터시티경산 (경산 053-743-4219)",
];
