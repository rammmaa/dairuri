alter table posts
  add column if not exists profile_mode text,
  add column if not exists available_tasks text[] not null default '{}',
  add column if not exists employment_types text[] not null default '{}',
  add column if not exists preferred_pay text,
  add column if not exists availability_note text,
  add column if not exists contact_note text;
