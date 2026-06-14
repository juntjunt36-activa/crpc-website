-- ==================================================
-- CRPC — DigiFinex order log + pg_cron template
-- ==================================================
-- This migration adds:
--   1. digifinex_order_log table (one row per order attempt, success or fail)
--   2. Required extensions for scheduled HTTP calls (pg_cron, pg_net)
--   3. Helper template (commented) for scheduling a recurring order
--
-- pg_cron and pg_net are available on Supabase Pro and above.

-- ============== Log table ==============
create table public.digifinex_order_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  mode text not null,                  -- 'single' | 'quote' | 'batch' | 'dry_run'
  request_body jsonb not null,         -- exact JSON the cron job POSTed
  digifinex_url text not null,
  response_status int,                 -- HTTP status from DigiFinex
  response_code int,                   -- DigiFinex application code (0 = success)
  response_body jsonb,                 -- full upstream payload
  order_id text,
  order_ids text[],
  duration_ms int,
  error text                           -- transport / signing error, null on success
);

create index idx_dfx_order_log_occurred_at
  on public.digifinex_order_log (occurred_at desc);

alter table public.digifinex_order_log enable row level security;
-- No public read; service role only (the API route uses the service role client).

-- ============== Extensions for scheduling ==============
-- Both are managed by Supabase under the "Database → Extensions" page.
-- Enable them there if not already enabled.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============== Configuration ==============
-- The Supabase managed Postgres forbids `alter database ... set ...`. Use
-- Supabase Vault instead. Run once in the SQL Editor with the same value
-- you saved in Vercel as DIGIFINEX_CRON_SECRET:
--
--   select vault.create_secret(
--     'REPLACE_WITH_DIGIFINEX_CRON_SECRET',
--     'digifinex_cron_secret'
--   );
--
-- Verify retrieval:
--   select decrypted_secret from vault.decrypted_secrets
--   where name = 'digifinex_cron_secret';

-- ============== Schedule template ==============
-- Uncomment, edit, and run to schedule a recurring order.
-- Cron syntax: minute hour day month dow  (UTC).
--
-- Example A — every hour, place a 50 USDT market buy of crpc_usdt:
--
-- select cron.schedule(
--   'crpc-hourly-market-buy',
--   '0 * * * *',
--   $cron$
--   select net.http_post(
--     url := 'https://crpc-website.vercel.app/api/admin/digifinex-order',
--     headers := jsonb_build_object(
--       'authorization',
        'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'digifinex_cron_secret'
        ),
--       'content-type', 'application/json'
--     ),
--     body := jsonb_build_object(
--       'market', 'spot',
--       'symbol', 'crpc_usdt',
--       'type', 'buy_market',
--       'amount', 50
--     )
--   );
--   $cron$
-- );
--
-- Example B — every 5 minutes, place a bracket (limit buy + limit sell):
--
-- select cron.schedule(
--   'crpc-bracket-5min',
--   '*/5 * * * *',
--   $cron$
--   select net.http_post(
--     url := 'https://crpc-website.vercel.app/api/admin/digifinex-order',
--     headers := jsonb_build_object(
--       'authorization',
        'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'digifinex_cron_secret'
        ),
--       'content-type', 'application/json'
--     ),
--     body := jsonb_build_object(
--       'market', 'spot',
--       'symbol', 'crpc_usdt',
--       'quote', true,
--       'buy_price', 0.16,
--       'buy_amount', 100,
--       'sell_price', 0.18,
--       'sell_amount', 100,
--       'post_only', true
--     )
--   );
--   $cron$
-- );
--
-- ============== Management ==============
-- List scheduled jobs:        select * from cron.job;
-- Inspect recent runs:        select * from cron.job_run_details order by start_time desc limit 20;
-- Pause a job:                select cron.unschedule('crpc-hourly-market-buy');
-- Inspect order results:      select occurred_at, mode, response_code, order_id, error
--                             from public.digifinex_order_log
--                             order by occurred_at desc limit 50;
