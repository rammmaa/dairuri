-- Happy Bus Archive: routes, stops, route-stop ordering, and append-only sightings.
-- See docs/superpowers/specs/2026-05-22-bus-archive-design.md for context.
--
-- TODO: stop coordinates seeded by server/db/seedData.ts are placeholder values
--       until a Darori field survey provides real coordinates. Replace seed data,
--       not this migration, when surveyed values become available.

create table if not exists bus_routes (
  id text primary key,
  code text not null unique,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table if not exists bus_stops (
  id text primary key,
  name text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  created_at timestamptz not null default now()
);

create table if not exists bus_route_stops (
  route_id text not null references bus_routes(id) on delete cascade,
  stop_id text not null references bus_stops(id) on delete cascade,
  sequence integer not null,
  primary key (route_id, stop_id),
  unique (route_id, sequence)
);

-- Append-only community log of bus sightings.
-- reporter_id is never returned to clients; the server derives a 6-char
-- reporter_label = sha256(reporter_id || DARORI_REPORTER_LABEL_SALT)[0..5]
-- at read time. on delete set null preserves community data when a user
-- account is removed.
create table if not exists bus_sightings (
  id text primary key,
  route_id text not null references bus_routes(id) on delete restrict,
  stop_id text not null references bus_stops(id) on delete restrict,
  reporter_id text references users(id) on delete set null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  created_at timestamptz not null default now()
);

create index if not exists bus_sightings_stop_created_at_idx
  on bus_sightings(stop_id, created_at desc);

create index if not exists bus_sightings_route_created_at_idx
  on bus_sightings(route_id, created_at desc);

-- TODO(admin): when moderator tooling lands and we need "all sightings filed
-- by reporter X" queries, add `create index on bus_sightings(reporter_id)`.
-- v1 user-facing reads never filter by reporter so the index would be cost
-- without benefit; admin queries can scan in the meantime.
