alter table users
  add column if not exists login_id text;

create unique index if not exists users_login_id_unique_idx
  on users(login_id)
  where login_id is not null;
