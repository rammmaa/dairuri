import { mockBusRouteStops } from "./mockDomain";
import type { Weekday } from "../types/domain";

export const WEEKDAYS: Weekday[] = ["월", "화", "수", "목", "금", "토", "일"];

// Real first / last departure per route (source: namu.wiki Cheongdo Happy Bus,
// transcribed 2026-06-06). Each route runs 3 times a day, so we surface 3
// departures spread evenly between the first and last bus. The source has no
// per-weekday variation, so the weekday selector shows the same timetable each
// day. This is still not wired through the dual-mode service layer; it stays a
// client-side schedule until a live operator feed lands.
const ROUTE_SCHEDULE: Record<string, { first: string; last: string }> = {
  "route-happy-1": { first: "07:50", last: "16:50" },
  "route-happy-2": { first: "08:30", last: "18:00" },
  "route-happy-3": { first: "06:50", last: "15:30" },
  "route-happy-4": { first: "07:20", last: "16:30" },
  "route-happy-5": { first: "08:10", last: "17:20" },
  "route-happy-6": { first: "06:50", last: "15:40" },
};

const RUNS_PER_DAY = 3;
// Minutes a bus is later at each stop further down the route, so a stop near the
// end of the line reads a few minutes after the terminal departure.
const PER_STOP_OFFSET_MIN = 2;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(total: number): string {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

/**
 * Returns the (sorted, ascending) bus times for a route + stop. The weekday is
 * accepted for the UI selector but does not change the result, since the source
 * timetable does not vary by weekday. Unknown routes return an empty list.
 */
export function getBusArrivalTimes(
  routeId: string,
  stopId: string,
  _weekday: Weekday,
): string[] {
  const schedule = ROUTE_SCHEDULE[routeId];
  if (!schedule) {
    return [];
  }

  const first = toMinutes(schedule.first);
  const last = toMinutes(schedule.last);
  const sequence =
    mockBusRouteStops.find(
      (link) => link.routeId === routeId && link.stopId === stopId,
    )?.sequence ?? 1;
  const offset = (sequence - 1) * PER_STOP_OFFSET_MIN;
  const step = RUNS_PER_DAY > 1 ? (last - first) / (RUNS_PER_DAY - 1) : 0;

  return Array.from({ length: RUNS_PER_DAY }, (_unused, index) =>
    toHHMM(Math.round(first + step * index) + offset),
  );
}
