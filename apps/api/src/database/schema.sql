CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  region_verified BOOLEAN NOT NULL DEFAULT FALSE,
  driver_license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  insurance_registered BOOLEAN NOT NULL DEFAULT FALSE,
  driver_years INTEGER NOT NULL DEFAULT 0,
  manner_temperature NUMERIC(4, 1) NOT NULL DEFAULT 36.5,
  completed_rides INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  recommendation_rate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  departure_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  day_label TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  seats_total INTEGER NOT NULL,
  seats_left INTEGER NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  author_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  place_name TEXT NOT NULL,
  pay_label TEXT NOT NULL,
  schedule_label TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_reports (
  id TEXT PRIMARY KEY,
  route_number TEXT NOT NULL,
  place_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('ride', 'job')),
  listing_id TEXT NOT NULL,
  applicant_id TEXT REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('ride', 'job')),
  listing_id TEXT NOT NULL,
  participant_label TEXT NOT NULL,
  last_message TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
