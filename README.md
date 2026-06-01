# CRPC Website — Transparency Dashboard

Public dashboard for **CRPC (CryptPointToken)**: theoretical price `V`, point balance `J` (USD-converted from a JPY admin input), live DigiFinex market price, and JPY/USD FX rate — updated continuously.

> This site is intended for global investors only. Not available to residents of Japan.

## Stack

- Next.js 15 (App Router) · TypeScript strict
- Tailwind CSS 3 · shadcn-style primitives · Recharts
- next-intl (English-only) · next-themes (dark only)
- Supabase (Postgres + Auth + RLS) · `@supabase/ssr`
- SWR (60s / 10min polling)
- Vitest

## Pricing formula

```
V = a × (J_USD − b)^c
```

`J_USD` is derived from the admin-input `J_JPY` divided by the live JPY/USD rate. Parameters `a`, `b`, `c` are snapshotted into every `point_balance_history` row so past valuations remain reproducible.

## Routes

| Path | Purpose |
|---|---|
| `/` | Dashboard (5 cards + formula + 3 mini-charts) |
| `/history/{theoretical-price,point-balance,market-price}` | Full charts + tables |
| `/about` · `/trade` · `/roadmap` · `/terms` | Static content |
| `/admin` · `/admin/login` · `/admin/point-balance` | Auth-gated admin |
| `/api/*` | Server-rendered JSON endpoints |

Middleware (`src/middleware.ts`) protects `/admin/*` via Supabase Auth.

## Local development

```bash
pnpm install
cp .env.example .env.local      # fill in Supabase credentials
pnpm dev                        # http://localhost:3001
pnpm test                       # vitest
pnpm lint && pnpm typecheck && pnpm build
```

Apply `supabase/migrations/0001_initial.sql` then `0002_jpy_input_and_fx.sql` in your Supabase project's SQL Editor before running locally.

## Deployment

- Hosting: **Vercel**
- Cron: `/api/market-price` every minute, `/api/fx-rate/latest` every 10 min (see `vercel.json`)
- Required env vars: see `.env.example`

## Canonical spec

`docs/CRPC_Website_Spec_MVP.md` — single source of truth for product rules and regulatory boundaries.
