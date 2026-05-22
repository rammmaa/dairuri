// Pure-JavaScript Happy Bus archive helpers shared by the server repository
// (server/api/busArchive.ts) and the mock client API (services/mockApi.ts).
//
// Anything in this file MUST stay free of `pg`, `redis`, `node:fs`, or any
// other server-only dependency. The mobile bundle imports this file via the
// mock API, and the server imports it from server/api/busArchive.ts. Both
// import paths must compile cleanly.

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Maximum distance, in meters, between a reporter and the stop their sighting
 * is snapped to. Sightings beyond this radius are rejected. Default 300 m
 * was chosen from the prototype-map stop spacing (~400–600 m) and should be
 * revisited once Darori field data is available. Can be overridden at module
 * load time via `DARORI_BUS_SNAP_RADIUS_M`.
 */
export const NEAREST_STOP_RADIUS_METERS = Number(
  process.env.DARORI_BUS_SNAP_RADIUS_M ?? 300,
);

export class BusSightingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusSightingInputError";
  }
}

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type RouteStopForSnap = {
  stopId: string;
  latitude: number;
  longitude: number;
};

export type RecordBusSightingInput = {
  routeId?: string;
  latitude?: number;
  longitude?: number;
};

export type ValidatedSightingInput = {
  routeId: string;
  latitude: number;
  longitude: number;
};

/**
 * Great-circle distance between two coordinates, in meters. Pure.
 */
export function haversine(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sa = Math.sin(dLat / 2);
  const sb = Math.sin(dLng / 2);
  const x =
    sa * sa +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sb * sb;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(x));
}

/**
 * Picks the closest stop within radiusMeters of the reporter. Returns null if
 * the closest stop is still beyond the radius. Pure.
 */
export function resolveNearestStop(
  reporter: LatLng,
  candidates: readonly RouteStopForSnap[],
  radiusMeters: number = NEAREST_STOP_RADIUS_METERS,
): RouteStopForSnap | null {
  let best: { stop: RouteStopForSnap; distance: number } | null = null;
  for (const stop of candidates) {
    const distance = haversine(reporter, {
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
    if (distance > radiusMeters) {
      continue;
    }
    if (!best || distance < best.distance) {
      best = { stop, distance };
    }
  }
  return best ? best.stop : null;
}

/**
 * Validates the body of POST /bus/sightings. Throws BusSightingInputError with
 * a stable client-facing message on bad input. Pure.
 */
export function normalizeRecordSightingInput(
  input: RecordBusSightingInput,
): ValidatedSightingInput {
  const routeId = typeof input.routeId === "string" ? input.routeId.trim() : "";
  if (!routeId) {
    throw new BusSightingInputError("routeId is required");
  }

  if (typeof input.latitude !== "number" || !Number.isFinite(input.latitude)) {
    throw new BusSightingInputError("latitude must be a finite number");
  }
  if (input.latitude < -90 || input.latitude > 90) {
    throw new BusSightingInputError("latitude out of range");
  }
  if (typeof input.longitude !== "number" || !Number.isFinite(input.longitude)) {
    throw new BusSightingInputError("longitude must be a finite number");
  }
  if (input.longitude < -180 || input.longitude > 180) {
    throw new BusSightingInputError("longitude out of range");
  }

  return { routeId, latitude: input.latitude, longitude: input.longitude };
}

/**
 * Deterministic 6-char identifier used as the mock-mode reporterLabel.
 *
 * This is NOT a cryptographic hash. The mobile bundle cannot use Node's
 * `createHash` without a polyfill, so mock mode uses a small FNV-1a variant.
 * The contract that callers depend on is preserved:
 *
 *   - `null` reporter → the literal string `"deleted"`.
 *   - Same `reporterId` + same `salt` → same 6-char hex output.
 *   - Different `salt` → different output (free rotation).
 *   - Different `reporterId` → different output (collision possible at the
 *     birthday-paradox bound for 24 bits, well below our ~hundreds of users).
 *
 * The server-side path (`server/api/busArchive.ts > reporterLabel`) uses
 * sha256 instead and is the source of truth for live mode. Mock and live
 * therefore emit different labels for the same reporter; that is acceptable
 * because the two modes are never used simultaneously.
 */
export function mockReporterLabel(
  reporterId: string | null,
  salt = "",
): string {
  if (!reporterId) {
    return "deleted";
  }
  const input = `${reporterId}::${salt}`;
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}
