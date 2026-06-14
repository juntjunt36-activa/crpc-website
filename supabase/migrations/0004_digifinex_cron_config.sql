-- ==================================================
-- CRPC — DigiFinex cron config + atomic counter consumption
-- ==================================================
-- Adds the 4 named cron configurations the admin UI manages:
--   buy1 / buy2 / sell1 / sell2
-- Each row carries symbol, amount, price, coupon_issued, coupon_used.
-- buy* crons consume coupon_issued; sell* crons consume coupon_used.
-- A consume happens atomically via the dfx_consume_cron_counter() function
-- so concurrent cron invocations can never over-execute.

-- ============== Config table ==============
create table public.digifinex_cron_config (
  name text primary key
    check (name in ('buy1', 'buy2', 'sell1', 'sell2')),
  symbol text not null default 'crpc_usdt',
  amount numeric not null default 0,
  price numeric not null default 0,
  coupon_issued integer not null default 0,
  coupon_used integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.digifinex_cron_config (name)
values ('buy1'), ('buy2'), ('sell1'), ('sell2');

alter table public.digifinex_cron_config enable row level security;

-- Authenticated admin can read and update.
create policy "dfx_cfg_read_auth"
  on public.digifinex_cron_config for select
  to authenticated using (true);

create policy "dfx_cfg_update_auth"
  on public.digifinex_cron_config for update
  to authenticated using (true) with check (true);

-- Touch updated_at on every change.
create or replace function public.set_dfx_cfg_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_dfx_cfg_updated_at
  before update on public.digifinex_cron_config
  for each row execute function public.set_dfx_cfg_updated_at();

-- ============== Atomic counter consumption ==============
-- Returns the config row if the relevant counter could be decremented (>0).
-- Returns no rows if the counter is already 0 — the caller should skip.
create or replace function public.dfx_consume_cron_counter(_job text)
returns table (
  name text,
  symbol text,
  amount numeric,
  price numeric,
  coupon_issued integer,
  coupon_used integer
)
language plpgsql
security definer
as $$
declare
  _field text;
begin
  if _job in ('buy1', 'buy2') then
    _field := 'coupon_issued';
  elsif _job in ('sell1', 'sell2') then
    _field := 'coupon_used';
  else
    raise exception 'dfx_consume_cron_counter: invalid job name %', _job;
  end if;

  return query execute format(
    'update public.digifinex_cron_config
       set %1$I = %1$I - 1
     where name = $1 and %1$I > 0
     returning name, symbol, amount, price, coupon_issued, coupon_used',
    _field
  ) using _job;
end;
$$;

grant execute on function public.dfx_consume_cron_counter(text) to service_role;

-- ============== Extend order log ==============
alter table public.digifinex_order_log
  add column if not exists job_name text,
  add column if not exists account smallint,
  add column if not exists coupon_remaining integer;

create index if not exists idx_dfx_order_log_job_name
  on public.digifinex_order_log (job_name, occurred_at desc);
