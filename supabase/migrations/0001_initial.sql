-- ==================================================
-- CRPC Website MVP — Initial Schema
-- See docs/CRPC_Website_Spec_MVP.md §7
-- ==================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============== point_balance_history ==============
-- Records every J input by admin. V is computed and stored at insert time.
create table public.point_balance_history (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz not null default now(),
  j_value numeric not null,                  -- Point issuance balance J
  v_value numeric not null,                  -- Theoretical price V at this J
  param_a numeric not null,                  -- Snapshot of a (in case of future param change)
  param_b numeric not null,                  -- Snapshot of b
  param_c numeric not null,                  -- Snapshot of c
  inserted_by uuid not null references auth.users(id),
  note text                                  -- Optional admin note
);

create index idx_pbh_recorded_at on public.point_balance_history (recorded_at desc);

-- ============== market_price_snapshots ==============
-- Cached market price from DigiFinex (or fallback). Written by API route.
create table public.market_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz not null default now(),
  price_usd numeric not null,
  source text not null,                      -- 'digifinex' | 'coingecko'
  raw_payload jsonb                          -- Original API response (debugging)
);

create index idx_mps_recorded_at on public.market_price_snapshots (recorded_at desc);

-- ============== audit_log ==============
-- Append-only audit trail. INSERT only.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users(id),
  action text not null,                      -- e.g., 'point_balance.insert'
  payload jsonb not null
);

create index idx_audit_occurred_at on public.audit_log (occurred_at desc);

-- ============== Row Level Security ==============

alter table public.point_balance_history enable row level security;
alter table public.market_price_snapshots enable row level security;
alter table public.audit_log enable row level security;

-- point_balance_history: anyone can read, only authenticated users can insert
create policy "pbh_read_all"
  on public.point_balance_history for select
  using (true);

create policy "pbh_insert_auth"
  on public.point_balance_history for insert
  to authenticated
  with check (auth.uid() = inserted_by);

-- No update/delete policy → forbidden for all (including authenticated)

-- market_price_snapshots: anyone can read; only service role (API route) writes
create policy "mps_read_all"
  on public.market_price_snapshots for select
  using (true);

-- audit_log: only service role reads/writes (no public read)
-- (No policies for authenticated/anon = no access)

-- ============== Trigger: audit on point_balance_history insert ==============

create or replace function public.log_pbh_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_log (actor_id, action, payload)
  values (
    new.inserted_by,
    'point_balance.insert',
    jsonb_build_object(
      'id', new.id,
      'j_value', new.j_value,
      'v_value', new.v_value,
      'note', new.note
    )
  );
  return new;
end;
$$;

create trigger trg_pbh_audit
  after insert on public.point_balance_history
  for each row
  execute function public.log_pbh_insert();
