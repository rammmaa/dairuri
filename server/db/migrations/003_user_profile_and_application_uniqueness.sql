alter table users
  add column if not exists avatar_url text;

create unique index if not exists applications_post_applicant_unique_idx
  on applications(post_id, applicant_id);
