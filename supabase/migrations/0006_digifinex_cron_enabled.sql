-- ==================================================
-- CRPC — Cron master ON/OFF flag
-- ==================================================
-- Adds a manual kill-switch on the singleton settings row.
-- The /api/admin/digifinex-order endpoint refuses to execute real cron-mode
-- orders when this flag is false. Dry-run and direct (non-cron) calls are
-- unaffected.
-- Default is FALSE so that applying the migration does NOT enable trading
-- by accident.

alter table public.digifinex_settings
  add column if not exists cron_enabled boolean not null default false;
