-- ==================================================
-- CRPC — DigiFinex settings → singleton + new counter routing
-- ==================================================
-- Supersedes migration 0004. Drops the per-job table and replaces it with a
-- single row of shared parameters. The counter mapping is now:
--   cron buy1  → checks coupon_issued (no decrement)
--   cron buy2  → checks coupon_used   (no decrement)
--   cron sell1 → checks coupon_used   AND decrements coupon_used
--   cron sell2 → checks coupon_issued AND decrements coupon_issued
--
-- Run this whether or not 0004 was applied — the drops are idempotent.

drop function if exists public.dfx_consume_cron_counter(text);
drop table if exists public.digifinex_cron_config cascade;

-- ============== Singleton settings table ==============
create table public.digifinex_settings (
  id smallint primary key default 1 check (id = 1),
  symbol text not null default 'crpc_usdt',
  amount numeric not null default 0,
  price numeric not null default 0,
  coupon_issued integer not null default 0,
  coupon_used integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.digifinex_settings (id) values (1)
on conflict (id) do nothing;

alter table public.digifinex_settings enable row level security;

create policy "dfx_settings_read_auth"
  on public.digifinex_settings for select
  to authenticated using (true);

create policy "dfx_settings_update_auth"
  on public.digifinex_settings for update
  to authenticated using (true) with check (true);

create or replace function public.set_dfx_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_dfx_settings_updated_at
  before update on public.digifinex_settings
  for each row execute function public.set_dfx_settings_updated_at();

-- ============== Counter consumption RPC ==============
-- Returns the settings row when the cron is allowed to fire (counter > 0).
-- For sell1 / sell2 the counter is also decremented atomically.
-- For buy1 / buy2 nothing is mutated.
-- Empty result set ⇒ the API route logs a skip and returns 200.
create or replace function public.dfx_consume_cron_counter(_job text)
returns table (
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
  _check_field text;
  _decrement_field text := null;
begin
  case _job
    when 'buy1'  then _check_field := 'coupon_issued';
    when 'buy2'  then _check_field := 'coupon_used';
    when 'sell1' then _check_field := 'coupon_used';
                       _decrement_field := 'coupon_used';
    when 'sell2' then _check_field := 'coupon_issued';
                       _decrement_field := 'coupon_issued';
    else raise exception 'dfx_consume_cron_counter: invalid job name %', _job;
  end case;

  if _decrement_field is not null then
    return query execute format(
      'update public.digifinex_settings
          set %1$I = %1$I - 1
        where id = 1 and %1$I > 0
        returning symbol, amount, price, coupon_issued, coupon_used',
      _decrement_field
    );
  else
    return query execute format(
      'select symbol, amount, price, coupon_issued, coupon_used
         from public.digifinex_settings
        where id = 1 and %1$I > 0',
      _check_field
    );
  end if;
end;
$$;

grant execute on function public.dfx_consume_cron_counter(text) to service_role;
