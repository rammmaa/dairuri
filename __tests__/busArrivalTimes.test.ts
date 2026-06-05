import { WEEKDAYS, getBusArrivalTimes } from "../data/busArrivalTimes";

describe("getBusArrivalTimes", () => {
  it("exposes the seven weekdays in 월-일 order", () => {
    expect(WEEKDAYS).toEqual(["월", "화", "수", "목", "금", "토", "일"]);
  });

  it("returns three stable, ascending times per route + stop", () => {
    const first = getBusArrivalTimes("route-happy-1", "stop-gumiri", "월");
    const second = getBusArrivalTimes("route-happy-1", "stop-gumiri", "월");

    expect(first).toHaveLength(3); // 3 runs/day
    expect(first).toEqual(second); // deterministic
    expect([...first].sort()).toEqual(first); // already ascending
  });

  it("does not vary by weekday (the source timetable is the same every day)", () => {
    const weekday = getBusArrivalTimes("route-happy-2", "stop-bumin-apt", "수");
    const weekend = getBusArrivalTimes("route-happy-2", "stop-bumin-apt", "일");

    expect(weekend).toEqual(weekday);
  });

  it("anchors the first and last run to the route schedule", () => {
    // H3 first bus 06:50 at the terminal (sequence 1, no offset).
    const times = getBusArrivalTimes(
      "route-happy-3",
      "stop-cheongdo-public-terminal",
      "월",
    );
    expect(times[0]).toBe("06:50");
    expect(times[times.length - 1]).toBe("15:30");
  });

  it("returns an empty list for an unknown route", () => {
    expect(getBusArrivalTimes("route-unknown", "stop-gumiri", "월")).toEqual([]);
  });
});
