import { WEEKDAYS, getBusArrivalTimes } from "../data/busArrivalTimes";

describe("getBusArrivalTimes", () => {
  it("exposes the seven weekdays in 월-일 order", () => {
    expect(WEEKDAYS).toEqual(["월", "화", "수", "목", "금", "토", "일"]);
  });

  it("returns a stable, sorted, non-empty list for a weekday", () => {
    const first = getBusArrivalTimes("route-happy-1", "stop-gumiri", "월");
    const second = getBusArrivalTimes("route-happy-1", "stop-gumiri", "월");

    expect(first.length).toBeGreaterThan(0);
    expect(first).toEqual(second); // deterministic
    expect([...first].sort()).toEqual(first); // already ascending
  });

  it("returns a shorter list on weekends than on weekdays", () => {
    const weekday = getBusArrivalTimes("route-happy-2", "stop-arae-gumi", "수");
    const weekend = getBusArrivalTimes("route-happy-2", "stop-arae-gumi", "일");

    expect(weekend.length).toBe(4);
    expect(weekday.length).toBeGreaterThan(weekend.length);
  });
});
