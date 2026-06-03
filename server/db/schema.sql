create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_type') then
    create type post_type as enum ('job', 'carpool');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_status') then
    create type post_status as enum ('open', 'closed');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type application_status as enum ('pending', 'accepted', 'rejected');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'driver_type') then
    create type driver_type as enum ('driver', 'non_driver');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'chat_message_type') then
    create type chat_message_type as enum ('system', 'text', 'image');
  end if;
end;
$$;

create table if not exists users (
  id text primary key,
  login_id text unique,
  nickname text not null,
  real_name text,
  phone text not null unique,
  email text unique,
  password_hash text,
  avatar_url text,
  area text,
  temperature numeric(4, 1) not null default 36.5,
  driver_type driver_type not null default 'non_driver',
  license_verified boolean not null default false,
  insurance_verified boolean not null default false,
  driver_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists phone_verifications (
  id text primary key,
  phone text not null,
  code_hash text not null,
  verified_token_hash text,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists vehicles (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  plate_number text not null,
  model_name text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id text primary key,
  type post_type not null,
  title text not null,
  body text not null,
  author_id text not null references users(id) on delete restrict,
  image_urls text[] not null default '{}',
  status post_status not null default 'open',
  place_name text,
  place_address text,
  departure text,
  destination text,
  days text[] not null default '{}',
  start_time text,
  end_time text,
  wage_type text,
  wage_amount integer,
  job_category text,
  profile_mode text,
  available_tasks text[] not null default '{}',
  employment_types text[] not null default '{}',
  preferred_pay text,
  availability_note text,
  contact_note text,
  price integer,
  seats integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_required_fields check (
    type <> 'job' or (place_name is not null and wage_amount is not null)
  ),
  constraint carpool_required_fields check (
    type <> 'carpool' or (departure is not null and destination is not null)
  )
);

create table if not exists post_likes (
  post_id text not null references posts(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists applications (
  id text primary key,
  post_id text not null references posts(id) on delete cascade,
  applicant_id text not null references users(id) on delete cascade,
  intro text not null,
  status application_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_rooms (
  id text primary key,
  post_id text references posts(id) on delete set null,
  title text not null,
  subtitle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_room_participants (
  room_id text not null references chat_rooms(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists chat_messages (
  id text primary key,
  room_id text not null references chat_rooms(id) on delete cascade,
  sender_id text references users(id) on delete set null,
  type chat_message_type not null,
  text text,
  image_url text,
  created_at timestamptz not null default now(),
  constraint text_message_has_body check (type <> 'text' or text is not null),
  constraint image_message_has_url check (type <> 'image' or image_url is not null)
);

create table if not exists manner_ratings (
  id text primary key,
  room_id text not null references chat_rooms(id) on delete cascade,
  rater_id text not null references users(id) on delete cascade,
  target_user_id text not null references users(id) on delete cascade,
  tags text[] not null,
  temperature_delta numeric(3, 1) not null,
  created_at timestamptz not null default now(),
  unique (room_id, rater_id, target_user_id)
);

create table if not exists reports (
  id text primary key,
  reporter_id text not null references users(id) on delete cascade,
  room_id text references chat_rooms(id) on delete set null,
  reported_user_id text references users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists auth_sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

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

create table if not exists bus_sightings (
  id text primary key,
  route_id text not null references bus_routes(id) on delete restrict,
  stop_id text not null references bus_stops(id) on delete restrict,
  reporter_id text references users(id) on delete set null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_type_status_created_at_idx
  on posts(type, status, created_at desc);

create index if not exists applications_post_status_idx
  on applications(post_id, status);

create unique index if not exists applications_post_applicant_unique_idx
  on applications(post_id, applicant_id);

create index if not exists chat_messages_room_created_at_idx
  on chat_messages(room_id, created_at);

create index if not exists auth_sessions_user_id_idx
  on auth_sessions(user_id);

create index if not exists auth_sessions_expires_at_idx
  on auth_sessions(expires_at);

create index if not exists phone_verifications_phone_created_at_idx
  on phone_verifications(phone, created_at desc);

create index if not exists phone_verifications_expires_at_idx
  on phone_verifications(expires_at);

create index if not exists bus_sightings_stop_created_at_idx
  on bus_sightings(stop_id, created_at desc);

create index if not exists bus_sightings_route_created_at_idx
  on bus_sightings(route_id, created_at desc);
