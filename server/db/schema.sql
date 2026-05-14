create extension if not exists pgcrypto;

create type post_type as enum ('job', 'carpool');
create type post_status as enum ('open', 'closed');
create type application_status as enum ('pending', 'accepted', 'rejected');
create type driver_type as enum ('driver', 'non_driver');
create type chat_message_type as enum ('system', 'text');

create table if not exists users (
  id text primary key,
  nickname text not null,
  real_name text,
  phone text not null unique,
  email text unique,
  area text,
  temperature numeric(4, 1) not null default 36.5,
  driver_type driver_type not null default 'non_driver',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  created_at timestamptz not null default now(),
  constraint text_message_has_body check (type <> 'text' or text is not null)
);

create table if not exists reports (
  id text primary key,
  reporter_id text not null references users(id) on delete cascade,
  room_id text references chat_rooms(id) on delete set null,
  reported_user_id text references users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_type_status_created_at_idx
  on posts(type, status, created_at desc);

create index if not exists applications_post_status_idx
  on applications(post_id, status);

create index if not exists chat_messages_room_created_at_idx
  on chat_messages(room_id, created_at);
