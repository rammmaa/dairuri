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

create index if not exists phone_verifications_phone_created_at_idx
  on phone_verifications(phone, created_at desc);

create index if not exists phone_verifications_expires_at_idx
  on phone_verifications(expires_at);
