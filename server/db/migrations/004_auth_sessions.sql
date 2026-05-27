alter table users
  add column if not exists password_hash text;

create table if not exists auth_sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_sessions_user_id_idx
  on auth_sessions(user_id);

create index if not exists auth_sessions_expires_at_idx
  on auth_sessions(expires_at);
