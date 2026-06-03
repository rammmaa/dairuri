import type { Weekday } from "../types/domain";

export const WEEKDAYS: Weekday[] = ["월", "화", "수", "목", "금", "토", "일"];

// Placeholder arrival schedule for the bus arrival-times screen. These are
// static demo values, NOT a real operator timetable and NOT wired through the
// dual-mode service layer. A later iteration moves this behind services/api.ts
// once a surveyed Cheongdo Happy Bus schedule lands; until then the screen has
// stable content to render. See the 2026-05-26 realign spec finalization note.
const BASE_TIMES = [
  "06:40",
  "07:55",
  "08:40",
  "10:10",
  "12:48",
  "13:27",
  "15:39",
  "17:01",
  "18:00",
  "19:20",
];

// Small deterministic hash so each (route, stop, weekday) shows a stable but
// slightly different slice of the base timetable. No Math.random / Date so the
// result is reproducible in tests.
function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Returns the placeholder arrival times for a route + stop on a given weekday,
 * sorted ascending. Weekends (토/일) return a shorter list so the weekday
 * selector visibly changes the result.
 */
export function getBusArrivalTimes(
  routeId: string,
  stopId: string,
  weekday: Weekday,
): string[] {
  const seed = hashSeed(`${routeId}::${stopId}::${weekday}`);
  const isWeekend = weekday === "토" || weekday === "일";
  const count = isWeekend ? 4 : 6 + (seed % 2); // 4 on weekends, 6-7 on weekdays
  const start = seed % (BASE_TIMES.length - count + 1);
  return BASE_TIMES.slice(start, start + count);
}
