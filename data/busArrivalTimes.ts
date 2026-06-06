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

// Route 3 has a real per-stop timetable from the route doc (2026-06-06): the
// last run leaves the terminal at 15:30 outbound and the terminus at 16:00
// inbound, and each stop's minute offset is taken from that run. The route runs
// 3 times a day, so each stop's times are the three outbound runs (06:50 /
// 10:30 / 15:30 starts) plus the three inbound runs (07:20 / 11:00 / 16:00
// starts), each shifted by the stop's offset. Chukhyeop and Beomgok Humansia
// apt are excluded from the implemented route.
const ROUTE3_OUTBOUND_STARTS = ["06:50", "10:30", "15:30"];
const ROUTE3_INBOUND_STARTS = ["07:20", "11:00", "16:00"];
const ROUTE3_OFFSETS: Record<string, { out?: number; in?: number }> = {
  "stop-cheongdo-public-terminal": { out: 0, in: 22 },
  "stop-cheongdo-market": { out: 1, in: 20 },
  "stop-seongjo-apt": { out: 3, in: 18 },
  "stop-bumin-apt": { out: 3, in: 16 },
  "stop-county-office": { out: 4, in: 15 },
  "stop-koaru-apt": { out: 5, in: 14 },
  "stop-beomgok-crossroad": { out: 7, in: 14 },
  "stop-sports-field": { out: 10, in: 11 },
  "stop-dongcheon-ri": { out: 12, in: 9 },
  "stop-eupseong": { out: 13, in: 7 },
  "stop-hwayang-police": { out: 16, in: 6 },
  "stop-seosang-super": { out: 17, in: 4 },
  "stop-cheongseokgol-farm": { out: 29, in: 1 },
  "stop-sinbong-hongdo": { out: 30, in: 0 },
};

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
  // Route 3 uses the real per-stop timetable (both travel directions).
  if (routeId === "route-happy-3") {
    const offsets = ROUTE3_OFFSETS[stopId];
    if (!offsets) {
      return [];
    }
    const times: number[] = [];
    if (offsets.out !== undefined) {
      for (const start of ROUTE3_OUTBOUND_STARTS) {
        times.push(toMinutes(start) + offsets.out);
      }
    }
    if (offsets.in !== undefined) {
      for (const start of ROUTE3_INBOUND_STARTS) {
        times.push(toMinutes(start) + offsets.in);
      }
    }
    return times.sort((a, b) => a - b).map(toHHMM);
  }

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
