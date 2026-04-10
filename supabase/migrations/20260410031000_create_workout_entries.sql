create table if not exists public.workout_entries (
  week_num integer not null check (week_num between 1 and 12),
  day_idx integer not null check (day_idx between 0 and 5),
  exercise_idx integer not null check (exercise_idx >= 0),
  set_num integer not null check (set_num >= 1),
  weight numeric(8,2) not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (week_num, day_idx, exercise_idx, set_num)
);

create table if not exists public.sync_meta (
  id integer primary key check (id = 1),
  last_synced_at timestamptz not null default timezone('utc', now())
);

insert into public.sync_meta (id)
values (1)
on conflict (id) do nothing;
