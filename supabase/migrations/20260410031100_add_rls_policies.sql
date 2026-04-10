alter table public.workout_entries enable row level security;
alter table public.sync_meta enable row level security;

-- No public policies are created intentionally.
-- Browser clients must call the protected Edge Function.
