alter table posts
  add column if not exists place_latitude numeric(9, 6),
  add column if not exists place_longitude numeric(9, 6);
