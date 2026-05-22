import { formatLastSightingLabel } from "../data/busSightingFormat";

describe("formatLastSightingLabel", () => {
  // Fixed reference point so the test is independent of the wall clock.
  const NOW = Date.parse("2026-05-22T09:00:00.000Z");

  it("returns undefined for missing input", () => {
    expect(formatLastSightingLabel(undefined, NOW)).toBeUndefined();
  });

  it("returns undefined for an unparseable timestamp", () => {
    expect(formatLastSightingLabel("not-a-date", NOW)).toBeUndefined();
  });

  it("returns '방금' for sightings less than a minute old", () => {
    expect(
      formatLastSightingLabel("2026-05-22T08:59:30.000Z", NOW),
    ).toBe("방금");
  });

  it("returns 'N분 전' for sightings within the last hour", () => {
    expect(
      formatLastSightingLabel("2026-05-22T08:55:00.000Z", NOW),
    ).toBe("5분 전");
    expect(
      formatLastSightingLabel("2026-05-22T08:01:00.000Z", NOW),
    ).toBe("59분 전");
  });

  it("returns undefined for sightings older than 60 minutes (treated as stale)", () => {
    expect(
      formatLastSightingLabel("2026-05-22T08:00:00.000Z", NOW),
    ).toBeUndefined();
    expect(
      formatLastSightingLabel("2026-05-21T20:00:00.000Z", NOW),
    ).toBeUndefined();
  });

  it("returns undefined for future timestamps (clock skew or bad data)", () => {
    expect(
      formatLastSightingLabel("2026-05-22T09:05:00.000Z", NOW),
    ).toBeUndefined();
  });
});
