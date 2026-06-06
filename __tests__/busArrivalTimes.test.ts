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

  it("uses the real per-stop timetable for route 3 (both directions)", () => {
    // 청도시장: outbound 06:51/10:31/15:31 + inbound 07:40/11:20/16:20.
    const market = getBusArrivalTimes(
      "route-happy-3",
      "stop-cheongdo-market",
      "월",
    );
    expect(market).toEqual([
      "06:51",
      "07:40",
      "10:31",
      "11:20",
      "15:31",
      "16:20",
    ]);

    // Terminal: outbound departures 06:50/10:30/15:30 plus inbound arrivals.
    const terminal = getBusArrivalTimes(
      "route-happy-3",
      "stop-cheongdo-public-terminal",
      "월",
    );
    expect(terminal[0]).toBe("06:50");
    expect(terminal).toContain("15:30");

    // Excluded stops (축협) are not on route 3 and return nothing.
    expect(getBusArrivalTimes("route-happy-3", "stop-chukhyeop", "월")).toEqual(
      [],
    );
  });

  it("returns an empty list for an unknown route", () => {
    expect(getBusArrivalTimes("route-unknown", "stop-gumiri", "월")).toEqual([]);
  });
});
