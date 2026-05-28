alter table users
  add column if not exists license_verified boolean not null default false,
  add column if not exists insurance_verified boolean not null default false,
  add column if not exists driver_verified_at timestamptz;

update users
set
  license_verified = true,
  insurance_verified = true,
  driver_verified_at = coalesce(driver_verified_at, now())
where driver_type = 'driver'
  and exists(select 1 from vehicles v where v.user_id = users.id);

alter table chat_messages
  add column if not exists image_url text;

do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'image'
      and enumtypid = 'chat_message_type'::regtype
  ) then
    alter type chat_message_type add value 'image';
  end if;
end;
$$;

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
