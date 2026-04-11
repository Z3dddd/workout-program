create table if not exists public.cardio_entries (
  week_num integer not null check (week_num between 1 and 12),
  day_idx integer not null check (day_idx between 1 and 6),
  stair_minutes numeric(8,2) not null default 0,
  treadmill_minutes numeric(8,2) not null default 0,
  total_minutes numeric(8,2) not null default 0,
  stairs_climbed integer not null default 0,
  treadmill_distance numeric(8,2) not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (week_num, day_idx)
);

alter table public.cardio_entries enable row level security;

-- No public policies are created intentionally.
-- Browser clients must call the protected Edge Function.
