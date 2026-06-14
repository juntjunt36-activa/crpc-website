-- ==================================================
-- CRPC — Vowcha daily ingest
-- ==================================================
-- Lets the scheduled vowcha-API ingester insert J snapshots without a
-- Supabase user identity, while still tagging the source.

alter table public.point_balance_history
  alter column inserted_by drop not null;

alter table public.point_balance_history
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'vowcha-api'));

-- Raw API call log — every fetch (success or failure, live or dry-run) goes here
create table if not exists public.vowcha_ingest_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  target_date date,
  fetched_from text not null,
  http_status int,
  response_body jsonb,
  parsed_j_jpy numeric,
  parsed_field_name text,
  point_balance_id uuid references public.point_balance_history(id),
  error text
);

create index if not exists idx_vowcha_log_occurred_at
  on public.vowcha_ingest_log (occurred_at desc);

create index if not exists idx_vowcha_log_target_date
  on public.vowcha_ingest_log (target_date desc);

alter table public.vowcha_ingest_log enable row level security;
-- service-role only; no public read.
