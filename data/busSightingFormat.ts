/**
 * Returns a human-friendly relative-time label for the supplied ISO
 * timestamp. The output is the Korean phrase shown on the route card badge:
 * the "minute-ago" form for sightings within the last hour, and the
 * "just now" form for sightings within the last minute. Returns undefined
 * when the input is missing or is older than 60 minutes, so a stale sighting
 * does not show as a misleading "freshness" badge.
 *
 * Exported as a pure helper so it can be unit-tested without rendering a
 * screen; consumed by `RouteScreen` for the per-route sighting badge.
 *
 * @param iso  ISO timestamp string, or undefined.
 * @param now  Reference timestamp in ms (defaults to `Date.now()`). Tests can
 *             pass a fixed value to make the result deterministic.
 */
export function formatLastSightingLabel(
  iso: string | undefined,
  now: number = Date.now(),
): string | undefined {
  if (!iso) return undefined;
  const recordedAt = new Date(iso).getTime();
  if (Number.isNaN(recordedAt)) return undefined;
  const minutesAgo = Math.floor((now - recordedAt) / 60_000);
  if (minutesAgo < 0) return undefined;
  if (minutesAgo < 1) return "방금";
  if (minutesAgo >= 60) return undefined;
  return `${minutesAgo}분 전`;
}
