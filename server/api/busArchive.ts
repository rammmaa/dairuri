import { createHash } from "node:crypto";

import {
  BusSightingInputError,
  NEAREST_STOP_RADIUS_METERS,
  type LatLng,
  type RecordBusSightingInput,
  type RouteStopForSnap,
  haversine,
  normalizeRecordSightingInput,
  resolveNearestStop,
} from "../../services/busArchiveCore";
import type { BusRoute, BusSighting, BusStop } from "../../types/domain";
import { getPostgresPool } from "../db/postgres";
import { getRedisClient } from "../db/redis";

// Pure helpers, validation, the snap radius constant, and the input error are
// owned by services/busArchiveCore.ts so the mock client API can reuse them.
// We re-export them here so existing server-side tests and routes can keep
// importing from server/api/busArchive without learning about the split.
export {
  BusSightingInputError,
  NEAREST_STOP_RADIUS_METERS,
  haversine,
  normalizeRecordSightingInput,
  resolveNearestStop,
};
export type { LatLng, RecordBusSightingInput, RouteStopForSnap };

// ---------------------------------------------------------------------------
// Server-only constants and helpers
// ---------------------------------------------------------------------------
//
// reporterLabel uses node:crypto's sha256, which is not available in the
// React Native bundle. Mock mode has its own deterministic FNV-1a helper
// (mockReporterLabel) in services/busArchiveCore.ts. The two algorithms emit
// different labels for the same reporter; that is acceptable because mock and
// live modes are mutually exclusive at runtime.

/**
 * Salt used to derive the per-reporter 6-char `reporterLabel` returned to
 * clients. Empty in development; production deployments MUST set
 * DARORI_REPORTER_LABEL_SALT to a random value of at least 32 chars. Salt
 * rotation is free because labels are computed at read time.
 */
const REPORTER_LABEL_SALT = process.env.DARORI_REPORTER_LABEL_SALT ?? "";

const REDIS_LAST_SIGHTING_KEY_PREFIX = "darori:bus:last:";
const REDIS_LAST_SIGHTING_TTL_SECONDS = 3600;
const DEFAULT_SIGHTING_LIMIT = 20;
const MAX_SIGHTING_LIMIT = 100;

let saltWarningEmitted = false;
function maybeWarnEmptySalt(salt: string) {
  if (!saltWarningEmitted && !salt) {
    saltWarningEmitted = true;
    console.warn(
      "DARORI_REPORTER_LABEL_SALT is not set; reporter labels are deterministic but offer no protection against reverse lookup. Set the env var in production.",
    );
  }
}

/**
 * Derives the 6-char anonymized identifier returned to clients. Pure.
 *
 *   - `reporterId === null` → `"deleted"` (the underlying account is gone).
 *   - Same `reporterId` + same `salt` → same label (the stability property
 *     moderators rely on to spot a repeat suspicious reporter).
 *   - Different `salt` → different label (free rotation).
 *
 * The salt is taken from `DARORI_REPORTER_LABEL_SALT` by default but accepted
 * as an argument so tests can verify rotation behavior without env mutation.
 */
export function reporterLabel(
  reporterId: string | null,
  salt: string = REPORTER_LABEL_SALT,
): string {
  if (!reporterId) {
    return "deleted";
  }
  maybeWarnEmptySalt(salt);
  return createHash("sha256")
    .update(`${reporterId}::${salt}`)
    .digest("hex")
    .slice(0, 6);
}

// ---------------------------------------------------------------------------
// Row types (snake_case from PostgreSQL)
// ---------------------------------------------------------------------------

type BusRouteRow = {
  id: string;
  code: string;
  name: string;
  color: string;
  last_sighting_at: Date | null;
};

type BusStopRow = {
  id: string;
  name: string;
  latitude: string | number;
  longitude: string | number;
  last_sighting_at: Date | null;
};

type RouteStopRow = {
  stop_id: string;
  latitude: string | number;
  longitude: string | number;
};

type BusSightingRow = {
  id: string;
  route_id: string;
  stop_id: string;
  reporter_id: string | null;
  latitude: string | number;
  longitude: string | number;
  created_at: Date;
};

// ---------------------------------------------------------------------------
// Repository (PostgreSQL + Redis)
// ---------------------------------------------------------------------------

export async function listBusRoutes(): Promise<BusRoute[]> {
  // Use a LEFT JOIN on the latest sighting per route so the route appears
  // even when no sighting has been recorded yet.
  const { rows } = await getPostgresPool().query<BusRouteRow>(
    `
      select
        r.id,
        r.code,
        r.name,
        r.color,
        (
          select s.created_at
          from bus_sightings s
          where s.route_id = r.id
          order by s.created_at desc
          limit 1
        ) as last_sighting_at
      from bus_routes r
      order by r.code asc
    `,
  );
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    color: row.color,
    lastSightingAt: row.last_sighting_at?.toISOString(),
  }));
}

export async function listBusStops(): Promise<BusStop[]> {
  const { rows } = await getPostgresPool().query<BusStopRow>(
    `
      select
        s.id,
        s.name,
        s.latitude,
        s.longitude,
        (
          select bs.created_at
          from bus_sightings bs
          where bs.stop_id = s.id
          order by bs.created_at desc
          limit 1
        ) as last_sighting_at
      from bus_stops s
      order by s.id asc
    `,
  );

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      lastSightingAt: await resolveLastSightingAt(row.id, row.last_sighting_at),
    })),
  );
}

export async function listSightingsForStop(
  stopId: string,
  limit: number = DEFAULT_SIGHTING_LIMIT,
): Promise<BusSighting[]> {
  const boundedLimit = Math.min(Math.max(limit, 1), MAX_SIGHTING_LIMIT);
  const { rows } = await getPostgresPool().query<BusSightingRow>(
    `
      select id, route_id, stop_id, reporter_id, latitude, longitude, created_at
      from bus_sightings
      where stop_id = $1
      order by created_at desc
      limit $2
    `,
    [stopId, boundedLimit],
  );
  return rows.map(mapSightingRow);
}

export async function recordBusSighting(
  input: RecordBusSightingInput,
  userId: string,
): Promise<BusSighting> {
  const validated = normalizeRecordSightingInput(input);
  const pool = getPostgresPool();

  const { rows: candidates } = await pool.query<RouteStopRow>(
    `
      select bs.id as stop_id, bs.latitude, bs.longitude
      from bus_route_stops brs
      join bus_stops bs on bs.id = brs.stop_id
      where brs.route_id = $1
      order by brs.sequence asc
    `,
    [validated.routeId],
  );

  if (candidates.length === 0) {
    throw new BusSightingInputError("route not found");
  }

  const snapped = resolveNearestStop(
    { latitude: validated.latitude, longitude: validated.longitude },
    candidates.map((row) => ({
      stopId: row.stop_id,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    })),
  );

  if (!snapped) {
    throw new BusSightingInputError("no nearby stop on route");
  }

  const id = `sighting-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const { rows } = await pool.query<BusSightingRow>(
    `
      insert into bus_sightings (
        id, route_id, stop_id, reporter_id, latitude, longitude, created_at
      ) values ($1, $2, $3, $4, $5, $6, $7)
      returning id, route_id, stop_id, reporter_id, latitude, longitude, created_at
    `,
    [
      id,
      validated.routeId,
      snapped.stopId,
      userId,
      validated.latitude,
      validated.longitude,
      createdAt,
    ],
  );

  await updateLastSightingCache(snapped.stopId, createdAt);

  return mapSightingRow(rows[0]);
}

async function resolveLastSightingAt(
  stopId: string,
  fallback: Date | null,
): Promise<string | undefined> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(`${REDIS_LAST_SIGHTING_KEY_PREFIX}${stopId}`);
    if (cached) {
      return cached;
    }
  } catch {
    // Redis is best-effort cache; fall back to the SQL value.
  }
  return fallback ? fallback.toISOString() : undefined;
}

async function updateLastSightingCache(stopId: string, createdAt: string) {
  try {
    const client = await getRedisClient();
    await client.set(
      `${REDIS_LAST_SIGHTING_KEY_PREFIX}${stopId}`,
      createdAt,
      { EX: REDIS_LAST_SIGHTING_TTL_SECONDS },
    );
  } catch {
    // Redis is best-effort; missing the cache write only forces the next
    // listBusStops call to read last_sighting_at from SQL.
  }
}

function mapSightingRow(row: BusSightingRow): BusSighting {
  return {
    id: row.id,
    routeId: row.route_id,
    stopId: row.stop_id,
    reporterLabel: reporterLabel(row.reporter_id),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    createdAt: row.created_at.toISOString(),
  };
}
