-- ==================================================
-- CRPC Website — JPY input + FX conversion
-- Date: 2026-05-24
-- ==================================================
-- Admin now enters point balance in JPY. Server converts to USD via the latest
-- JPY/USD FX rate before applying the V = a(J − b)^c formula. The DB keeps
-- snapshot copies of all three (j_jpy input, fx rate, resulting j_usd) so
-- historical valuations remain auditable even if rates or params change.
--
-- Semantics after this migration:
--   point_balance_history.j_value              = J in USD (used in formula). UNCHANGED column.
--   point_balance_history.j_value_jpy          = original JPY input.       NEW.
--   point_balance_history.fx_rate_jpy_per_usd  = FX rate used at insert.   NEW.
--
-- Legacy rows from before this migration:
--   - j_value_jpy / fx_rate_jpy_per_usd remain NULL.
--   - j_value is preserved as-is (interpretation may be off; consider deleting
--     test rows manually if charts look odd).

-- ============== fx_rate_snapshots ==============
-- Append-only history of JPY/USD rates fetched from frankfurter / open-er-api.
create table public.fx_rate_snapshots (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz not null default now(),
  jpy_per_usd numeric not null,                  -- e.g. 159.15
  rate_date date,                                -- API-reported date (may differ from recorded_at)
  source text not null,                          -- 'frankfurter' | 'open-er-api'
  raw_payload jsonb
);

create index idx_fx_recorded_at on public.fx_rate_snapshots (recorded_at desc);

-- RLS: public read (transparency), service role writes only.
alter table public.fx_rate_snapshots enable row level security;

create policy "fx_read_all"
  on public.fx_rate_snapshots for select
  using (true);

-- No insert/update/delete policy → only the service role can write.

-- ============== point_balance_history: add JPY-input columns ==============

alter table public.point_balance_history
  add column if not exists j_value_jpy numeric,
  add column if not exists fx_rate_jpy_per_usd numeric;

comment on column public.point_balance_history.j_value
  is 'Point balance in USD used in the V = a(J - b)^c formula. NULL means legacy row recorded before JPY conversion was introduced.';

comment on column public.point_balance_history.j_value_jpy
  is 'Original admin input in JPY (set after migration 0002). NULL for legacy rows.';

comment on column public.point_balance_history.fx_rate_jpy_per_usd
  is 'JPY/USD FX rate snapshotted at the moment of insert. NULL for legacy rows.';
