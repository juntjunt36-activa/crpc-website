# CRPC Official Website — MVP Specification

**Project**: CRPC (CryptPointToken) Official Website
**Version**: MVP 1.0
**Created**: 2026-05-23
**Owner**: 堤様
**Target Reader**: Claude Code (implementation agent)
**Repository**: GitHub (new, personal account)
**Hosting**: Vercel
**Timeline**: ~1 week from kickoff

---

## Notation

| Symbol | Meaning |
|---|---|
| 🔴 **MUST** | Absolute requirement |
| 🟡 **SHOULD** | Strong recommendation |
| 🟢 **MAY** | Optional |
| ⚠️ **WARNING** | Regulatory / legal risk |
| 🚫 **PROHIBITED** | Absolute prohibition |
| 📝 **TBD** | Value to be provided before implementation |
| 🔗 **REF** | Cross-reference |

---

# 1. Project Overview

## 1.1 Goal

Build a public website that displays CRPC (CryptPointToken) tokenomics transparency in real time and guides global investors to DigiFinex for actual trading. The site itself does **not** execute token trades.

## 1.2 Core MVP Features (8 features only)

| # | Feature | Description |
|---|---|---|
| M-1 | Dashboard (Home) | Display theoretical price V, point balance J, DigiFinex market price, and deviation% on one page |
| M-2 | V history page | Time-series chart of theoretical price |
| M-3 | J history page | Time-series chart of point issuance balance |
| M-4 | Market price history page | Time-series chart of DigiFinex market price |
| M-5 | Project explanation page | Investor-oriented explanation of token economics |
| M-6 | Trade guide page | Instructions and link to DigiFinex Spot |
| M-7 | Admin panel | 堤's daily input of J (Supabase Auth, single user) |
| M-8 | Roadmap page | Phase 1 → Phase 2 (CRPC v2) → Phase 3 (DEX) |

## 1.3 Out of Scope (Phase 1.5 or later)

- Wallet address publication (addresses not yet finalized)
- Reserve composition (Tier 1/2/3) (auditor not yet selected)
- Multi-language UI (i18n scaffolding only; English-only at launch)
- Light/dark theme toggle (dark only)
- DEX integration (after CRPC v2 migration)
- Multi-chain deployment (after CRPC v2 migration)
- KYC, payments, on-site token transfers (regulatory)

---

# 2. Absolute Rules

## 2.1 Regulatory Rules

🔴 **MUST** — The site is English-only. No Japanese UI, ever.
🚫 **PROHIBITED** — Adding `ja` locale to i18n config.
🚫 **PROHIBITED** — Japanese meta tags, OGP text, alt text, or aria-labels.
🔴 **MUST** — Display the following English notice in both the footer and below the home page hero:
> "This site is intended for global investors only. Not available to residents of Japan."
🔴 **MUST** — Terms of Service must explicitly prohibit access by Japan residents (English).
🚫 **PROHIBITED** — Implementing any token sale, KYC, payment, or wallet-connected swap on this site.
🟡 **SHOULD** — Display a brief disclaimer that this site is informational only and does not constitute investment advice.

⚠️ **WARNING** — Violating these rules creates regulatory risk under Japan's Payment Services Act. They are non-negotiable.

## 2.2 Transparency Rules

🔴 **MUST** — Every data point on the dashboard must show a "Last updated" timestamp (UTC).
🔴 **MUST** — Theoretical price formula `V = a(J - b)^c` and current values of a, b, c must be openly displayed.
🔴 **MUST** — Wallet/contract references must link to Etherscan.

## 2.3 Security Rules

🔴 **MUST** — Admin panel must require Supabase Auth login.
🔴 **MUST** — Supabase Row Level Security (RLS) must be enabled on all tables.
🔴 **MUST** — All admin write operations must be recorded to `audit_log` table.
🔴 **MUST** — `audit_log` table must be INSERT-only (enforced by RLS / Postgres policies).
🚫 **PROHIBITED** — Committing API keys, service role keys, or any secrets to the repository.

## 2.4 Implementation Quality Rules

🔴 **MUST** — TypeScript with `"strict": true`.
🔴 **MUST** — All components are function components with hooks.
🔴 **MUST** — Responsive: mobile (375px), tablet (768px), desktop (1280px+) all working.
🔴 **MUST** — Dark theme only (no light theme toggle in MVP).
🚫 **PROHIBITED** — Hard-coded English strings in components. All text via `next-intl` translation keys, even though only English is available.
🚫 **PROHIBITED** — Browser `localStorage` / `sessionStorage` outside of `next-themes` (artifact constraint not applicable to Vercel, but kept as discipline).
🚫 **PROHIBITED** — Using `<form>` with native submission. Use `onClick` / `onChange` handlers calling server actions or API routes.

---

# 3. Pre-Implementation Values

## 3.1 Values Provided by 堤様 Before Implementation Starts

| # | Item | Status | Destination |
|---|---|---|---|
| P-1 | Pricing parameter `a` | Confirmed, to receive | `src/config/constants.ts` → `PRICE_PARAM_A` |
| P-2 | Pricing parameter `b` | Confirmed, to receive | `src/config/constants.ts` → `PRICE_PARAM_B` |
| P-3 | Pricing parameter `c` | Confirmed, to receive | `src/config/constants.ts` → `PRICE_PARAM_C` |
| P-4 | CRPC contract address | **Received** | `NEXT_PUBLIC_CRPC_CONTRACT_ADDRESS` = `0x61c4d061149fd7a559e021c8dffcfb364ffded1a` |
| P-5 | 堤様 admin email | To receive | Used to seed Supabase Auth user |
| P-6 | Initial J value (current point balance) | To receive | First row in `point_balance_history` |
| P-7 | Etherscan API key | To create | `ETHERSCAN_API_KEY` env var |
| P-8 | CoinGecko API key (optional) | To create | `COINGECKO_API_KEY` env var (free tier OK) |

🔴 **MUST** — Claude Code must NOT begin implementation of pricing logic until P-1, P-2, P-3 are received.

## 3.2 Values Deferred (Not Required for MVP)

| Item | Strategy |
|---|---|
| Licensed partner name | Not displayed in MVP (Trade page just links to DigiFinex) |
| Audit firm | Not displayed in MVP (no reserve dashboard) |
| Treasury / Reserve / Operating / Option Pool wallet addresses | Not displayed in MVP |
| Multi-chain expansion | Phase 2+ |

---

# 4. Tech Stack

| Layer | Tool | Version | Note |
|---|---|---|---|
| Framework | Next.js | 14 or 15 (latest stable) | App Router |
| Language | TypeScript | latest stable | `strict: true` |
| UI | Tailwind CSS | 3.x | |
| Components | shadcn/ui | latest | Dark mode preset |
| Charts | Recharts | 2.x | |
| i18n | next-intl | 3.x | English-only locale config |
| Theme | next-themes | latest | Used to force dark; toggle hidden in MVP |
| DB / Auth | Supabase | latest | Postgres + Auth |
| Hosting | Vercel | — | Hobby tier OK for launch |
| Package Manager | pnpm | latest | Faster than npm |
| On-chain data | Etherscan API | v2 | For contract & wallet balances |
| Market data | DigiFinex public API | v3 | Primary source for market price |
| Market data fallback | CoinGecko API | v3 | Fallback if DigiFinex fails |
| Math | Standard JS `Math.pow` | — | For `V = a(J-b)^c` |

🚫 **PROHIBITED** — Adding wallet-connection libraries (wagmi, RainbowKit, viem) in MVP. They belong to Phase 3.
🚫 **PROHIBITED** — Adding any database other than Supabase.

---

# 5. Directory Structure

```
crpc-website/
├── .claude/
│   ├── CLAUDE.md                        # Project rules (see §11)
│   └── skills/
│       ├── verify-build/SKILL.md
│       └── check-spec/SKILL.md
├── .env.local                           # NOT committed
├── .env.example                         # Committed, no secrets
├── .gitignore
├── messages/
│   └── en.json                          # All UI text
├── public/
│   ├── logo.svg                         # CRPC logo (to be provided)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (dark, i18n provider)
│   │   ├── page.tsx                     # M-1 Dashboard
│   │   ├── globals.css
│   │   ├── history/
│   │   │   ├── theoretical-price/page.tsx   # M-2
│   │   │   ├── point-balance/page.tsx       # M-3
│   │   │   └── market-price/page.tsx        # M-4
│   │   ├── about/page.tsx               # M-5 Project explanation
│   │   ├── trade/page.tsx               # M-6 Trade guide
│   │   ├── roadmap/page.tsx             # M-8 Roadmap
│   │   ├── terms/page.tsx               # Terms of Service
│   │   ├── admin/
│   │   │   ├── layout.tsx               # Auth-gated layout
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx                 # Admin dashboard
│   │   │   └── point-balance/page.tsx   # J input form
│   │   └── api/
│   │       ├── market-price/route.ts    # Cached DigiFinex price
│   │       ├── point-balance/
│   │       │   ├── latest/route.ts
│   │       │   └── history/route.ts
│   │       ├── theoretical-price/
│   │       │   ├── latest/route.ts
│   │       │   └── history/route.ts
│   │       └── admin/
│   │           └── point-balance/route.ts   # POST (admin only)
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── PriceCard.tsx
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── MarketPriceCard.tsx
│   │   │   ├── DeviationCard.tsx
│   │   │   └── LastUpdated.tsx
│   │   ├── charts/
│   │   │   ├── TheoreticalPriceChart.tsx
│   │   │   ├── PointBalanceChart.tsx
│   │   │   └── MarketPriceChart.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── GeoNotice.tsx            # "Not available to Japan residents"
│   │   └── admin/
│   │       └── PointBalanceForm.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser client
│   │   │   ├── server.ts                # Server (SSR) client
│   │   │   └── admin.ts                 # Service-role client (server-only)
│   │   ├── pricing.ts                   # V = a(J-b)^c
│   │   ├── digifinex.ts                 # DigiFinex API client
│   │   ├── etherscan.ts                 # Etherscan API client (used minimally)
│   │   ├── coingecko.ts                 # Fallback market price
│   │   └── format.ts                    # Number/timestamp formatters
│   ├── config/
│   │   ├── constants.ts                 # a, b, c, contract address const
│   │   └── site.ts                      # Site metadata
│   ├── i18n/
│   │   ├── config.ts                    # Locales config (en only)
│   │   └── request.ts                   # next-intl request handler
│   ├── middleware.ts                    # Admin route protection
│   └── types/
│       ├── pricing.ts
│       └── database.ts                  # Supabase generated types
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial.sql             # Schema (see §7)
│   └── seed.sql
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── package.json
├── pnpm-lock.yaml
└── README.md
```

---

# 6. Pricing Logic

## 6.1 Formula

```
V = a × (J - b)^c
```

Where:
- `V` = theoretical price (USD per 1 CRPC)
- `J` = total point issuance balance (number of points outstanding)
- `a`, `b`, `c` = constants 📝 TBD, supplied before implementation (see §3.1)

## 6.2 Implementation Skeleton

```typescript
// src/config/constants.ts
export const PRICE_PARAM_A = Number(process.env.NEXT_PUBLIC_PRICE_PARAM_A ?? '0');
export const PRICE_PARAM_B = Number(process.env.NEXT_PUBLIC_PRICE_PARAM_B ?? '0');
export const PRICE_PARAM_C = Number(process.env.NEXT_PUBLIC_PRICE_PARAM_C ?? '0');

export const CRPC_CONTRACT_ADDRESS = '0x61c4d061149fd7a559e021c8dffcfb364ffded1a';
export const CRPC_TOTAL_SUPPLY = 60_000_000_000;
```

```typescript
// src/lib/pricing.ts
import { PRICE_PARAM_A, PRICE_PARAM_B, PRICE_PARAM_C } from '@/config/constants';

export function calculateTheoreticalPrice(J: number): number {
  if (J <= PRICE_PARAM_B) return 0; // Guard: avoid NaN from negative base
  return PRICE_PARAM_A * Math.pow(J - PRICE_PARAM_B, PRICE_PARAM_C);
}

export function calculateDeviation(marketPrice: number, theoreticalPrice: number): number {
  if (theoreticalPrice === 0) return 0;
  return ((marketPrice - theoreticalPrice) / theoreticalPrice) * 100;
}
```

🔴 **MUST** — V is always computed from J. Never store V as the only source of truth.
🔴 **MUST** — When J is inserted into DB, V at that moment is computed and stored alongside (denormalized) for historical chart performance.
🔴 **MUST** — All numeric DB columns use `numeric` type (not `double precision`) to preserve precision.

## 6.3 Parameter Validation

🔴 **MUST** — On admin J input, validate:
- J must be a positive integer or decimal
- J must be greater than `b`
- Warn (do not block) if |J − previous_J| / previous_J > 10%

---

# 7. Database Schema

🔴 **MUST** — Run this as `supabase/migrations/0001_initial.sql`.

```sql
-- ==================================================
-- CRPC Website MVP — Initial Schema
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
```

🔴 **MUST** — Run this migration before any Next.js development against real Supabase.
🔴 **MUST** — Seed the first user (堤様) manually via Supabase dashboard (Auth → Add user) using P-5 email.

---

# 8. Data Sources

## 8.1 Source-to-Display Mapping

| Display item | Source | Cache TTL | Stored to DB? |
|---|---|---|---|
| Current J | Latest row of `point_balance_history` | 60s | Already stored |
| Current V | Computed from latest J | 60s | Already stored (denormalized) |
| Current market price | DigiFinex public API → fallback CoinGecko | 60s | Yes, every fetch |
| Deviation% | Computed client-side from V and market price | — | No |
| J history | `point_balance_history` table | 5min | — |
| V history | `point_balance_history` (v_value column) | 5min | — |
| Market price history | `market_price_snapshots` table | 5min | — |
| Last updated timestamps | `recorded_at` of each row | 60s | — |

## 8.2 Market Price Fetching

🔴 **MUST** — Implement a server-side fetch at `src/app/api/market-price/route.ts` with the following logic:

```typescript
// Pseudocode
1. Try DigiFinex API: GET https://openapi.digifinex.com/v3/ticker?symbol=crpc_usdt
   - Timeout: 5s
   - On success: parse price → store to market_price_snapshots, return.
2. On failure: try CoinGecko (if CRPC is listed there)
   - GET https://api.coingecko.com/api/v3/simple/price?ids=cryptpointtoken&vs_currencies=usd
3. On both failures: return the most recent row from market_price_snapshots with a `stale: true` flag.
```

🟡 **SHOULD** — Set up a Vercel Cron Job (`vercel.json`) to call this endpoint every 1 minute, so the DB accumulates history even when no user is browsing.

```json
// vercel.json
{
  "crons": [
    { "path": "/api/market-price?refresh=1", "schedule": "* * * * *" }
  ]
}
```

⚠️ **WARNING** — Verify that CRPC's DigiFinex symbol is correct (`crpc_usdt` is an assumption). Confirm via DigiFinex symbols endpoint and adjust `src/lib/digifinex.ts` accordingly.

## 8.3 Caching Pattern

🔴 **MUST** — Use Next.js `revalidate` on fetch:

```typescript
const res = await fetch(url, { next: { revalidate: 60 } });
```

🔴 **MUST** — Tag cached fetches so they can be revalidated on demand (e.g., when admin inserts new J).

```typescript
const res = await fetch(url, { next: { tags: ['market-price'], revalidate: 60 } });
// After admin action:
import { revalidateTag } from 'next/cache';
revalidateTag('point-balance');
```

---

# 9. Page Specifications

## 9.1 M-1: Dashboard (`/`)

### Layout (desktop ≥1280px)

```
┌──────────────────────────────────────────────────────────┐
│  Header (logo | Dashboard | About | Trade | Roadmap)     │
├──────────────────────────────────────────────────────────┤
│  GEO NOTICE: "Not available to residents of Japan."       │
├──────────────────────────────────────────────────────────┤
│  Hero: "CRPC — Reserve-Backed Self-Adjusting Utility"     │
│  Tagline: Two lines explaining the project                │
├──────────────────────────────────────────────────────────┤
│  [Theoretical V]  [Point Balance J]  [Market Price]       │
│   $0.0120         12,345,678,901      $0.0135            │
│   updated 32s ago updated 5m ago      updated 18s ago     │
├──────────────────────────────────────────────────────────┤
│  [Deviation Card: +12.5%  (market > theoretical)]         │
├──────────────────────────────────────────────────────────┤
│  Formula: V = a × (J - b)^c                               │
│  Current parameters: a = 0.0034, b = 12,000,000,000,       │
│                       c = 1.85                            │
├──────────────────────────────────────────────────────────┤
│  Three small charts (last 30 days):                       │
│  [V chart] [J chart] [Market chart]                       │
│  Each links to its history page.                          │
├──────────────────────────────────────────────────────────┤
│  Footer (geo notice repeat | links | © year)              │
└──────────────────────────────────────────────────────────┘
```

### Layout (mobile <768px)

🔴 **MUST** — Cards stack vertically. Charts collapse to height 200px. Formula displayed below cards. Header collapses to hamburger.

### Components Used

- `<PriceCard title="Theoretical Price (V)" value={V} unit="USD" updatedAt={pbh.recorded_at} />`
- `<BalanceCard title="Point Balance (J)" value={J} updatedAt={pbh.recorded_at} />`
- `<MarketPriceCard title="Market Price (DigiFinex)" value={market} updatedAt={mps.recorded_at} />`
- `<DeviationCard theoretical={V} market={market} />`
- Three `<MiniChart>` with link to `/history/...`

### Behavior

🔴 **MUST** — Initial render is server-rendered with fresh data. Client side polls every 60s via SWR or a `useEffect` setInterval.
🔴 **MUST** — Deviation card color: green if |dev| < 1%, yellow if 1%–10%, red if >10%.
🔴 **MUST** — If market price source is stale (>5min old), display "stale" badge.

## 9.2 M-2: V History (`/history/theoretical-price`)

- Full-width line chart, ~500px height on desktop, 300px on mobile.
- X axis: time, Y axis: V in USD.
- Time range selector: 7D / 30D / 90D / ALL (default 30D).
- Data source: `point_balance_history.v_value`.
- Below chart: table of recent entries (last 20 rows, columns: recorded_at, J, V, note).
- 🟡 **SHOULD** — Use Recharts `LineChart` with `ResponsiveContainer`.

## 9.3 M-3: J History (`/history/point-balance`)

- Same structure as M-2, but Y axis = J (point count, integer-formatted with commas).
- Data source: `point_balance_history.j_value`.
- 🟡 **SHOULD** — Use `Intl.NumberFormat` for grouping separators.

## 9.4 M-4: Market Price History (`/history/market-price`)

- Same structure. Y axis = market price USD.
- Data source: `market_price_snapshots.price_usd`.
- Show source badge per range (DigiFinex / CoinGecko).

## 9.5 M-5: About / Project Explanation (`/about`)

🔴 **MUST** — Investor-perspective explanation, not merchant-side. Must clearly cover:

1. **What CRPC is**: A self-adjusting utility token backed by point issuance from ACTIVA's loyalty program.
2. **What backs CRPC's value**: Outstanding point liability `J` issued by ACTIVA, which is mirrored into the CRPC ecosystem.
3. **How value increases**: As more points are issued (J grows), theoretical price V grows by the formula `V = a(J-b)^c`. Investor perspective: "Adoption of the merchant network → more points outstanding → higher theoretical token value."
4. **Why convergence happens**: Singapore CRPC entity actively market-makes on DigiFinex at theoretical price, so the on-exchange price gravitates toward V via arbitrage.
5. **The reserve & dual-entity structure**: Briefly explain ACTIVA (Japan) and CRPC (Singapore) roles, with reserve pool for redemption capacity.
6. **Limits**: This is not a security, no dividend, no guaranteed return. Risk disclosure.

🟡 **SHOULD** — Each of the above six points becomes its own section with a short subheading and 2–4 paragraphs.
🚫 **PROHIBITED** — Marketing-style hype language ("moon", "10x", "revolutionary").
🚫 **PROHIBITED** — Calling CRPC a "security", "investment product", or promising returns.
🟢 **MAY** — Include a simple SVG/Mermaid diagram of value flow.

📝 **TBD** — Final wording to be reviewed by 堤様 before launch.

## 9.6 M-6: Trade Guide (`/trade`)

🔴 **MUST** — Page content (English):

1. **Where to trade**: CRPC is listed on DigiFinex. Direct link to `https://www.digifinex.com/en-ww/trade/USDT/CRPC` (verify URL before launch).
2. **How to trade (step list)**:
   - Create a DigiFinex account
   - Complete DigiFinex KYC
   - Deposit USDT
   - Buy CRPC on the CRPC/USDT spot market
3. **About the price you'll see**: Our team actively makes a market at the theoretical price displayed on the dashboard. Market price tends to converge to V.
4. **Restrictions**: Lists DigiFinex restricted countries (Japan included).
5. **Big "Trade on DigiFinex" button** → external link with `rel="noopener noreferrer"` and `target="_blank"`.

🚫 **PROHIBITED** — Any input field, "buy" form, contact form, or interactive trading element on this page.

## 9.7 M-7: Admin Panel (`/admin/*`)

### Authentication

🔴 **MUST** — Middleware (`src/middleware.ts`) intercepts `/admin/*` paths:

```typescript
// src/middleware.ts (skeleton)
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  if (!req.nextUrl.pathname.startsWith('/admin')) return NextResponse.next();
  if (req.nextUrl.pathname === '/admin/login') return NextResponse.next();
  // Check session
  // ... redirect to /admin/login if not authenticated
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

### `/admin/login`

- Email + password form (Supabase Auth `signInWithPassword`)
- On success: redirect to `/admin`

### `/admin` (Dashboard)

- Welcome 堤様
- Cards:
  - Last J entry (value, when, who, note)
  - "Insert today's J" button → `/admin/point-balance`
- Recent 20 audit log entries (read-only)

### `/admin/point-balance`

- Input form:
  - `J value` (numeric input)
  - `Note` (optional text)
- On submit:
  - Validate (J > 0, J > b)
  - Compute V from current a, b, c
  - INSERT into `point_balance_history` with `inserted_by = auth.uid()`
  - Show success toast
  - Call `revalidateTag('point-balance')` to refresh public pages
- Warn if |J − previous_J| / previous_J > 10% (modal confirmation)

🔴 **MUST** — Server actions / API routes for this form must verify the session and `auth.uid()` server-side before insert.

## 9.8 M-8: Roadmap (`/roadmap`)

Static page. Content:

```
Phase 1 — Now (MVP)
  - Transparency dashboard
  - Live market data on DigiFinex
  - Active market making by official team

Phase 2 — Q3 2026 (planned)
  - CRPC v2 contract migration
  - Modern smart contract with full third-party audit
  - Multi-chain native support (Ethereum + Layer 2s)

Phase 3 — Q4 2026 (planned)
  - Decentralized exchange (DEX) integration
  - On-site Swap UI at theoretical price
  - Verified reserves dashboard
```

🟡 **SHOULD** — Each phase as a card with date, title, bullet list, status badge ("Live", "Planned").
🟢 **MAY** — Visual timeline graphic.

## 9.9 Terms of Service (`/terms`)

📝 **TBD** — Full legal text to be drafted with legal counsel before launch. Skeleton placeholders are acceptable for development, with a TODO marker.

🔴 **MUST** — Must include a clear English clause prohibiting access by residents of Japan.

---

# 10. Design System

## 10.1 Theme

- **Dark only** in MVP. `next-themes` configured with `defaultTheme="dark"` and `forcedTheme="dark"`.
- 🚫 **PROHIBITED** — Showing a theme toggle.

## 10.2 Colors (Tailwind config)

```typescript
// tailwind.config.ts (excerpt)
{
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0F172A',        // page background
          card: '#111827',         // card surfaces
          elevated: '#1F2937',     // hover / elevated
        },
        accent: {
          cyan: '#00D9FF',
          gold: '#FFD700',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#D1D5DB',
          muted: '#9CA3AF',
        },
        signal: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
    },
  },
}
```

## 10.3 Typography

- Headings: `Inter` (variable). Loaded via `next/font/google`.
- Body: `Inter`.
- Numeric values on dashboard: `Roboto Mono` for clarity.

## 10.4 Numeric Formatting

🔴 **MUST** — Use these helpers consistently:

```typescript
// src/lib/format.ts
export const formatUSD = (n: number, fractionDigits = 6) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-US').format(n);

export const formatPercent = (n: number, fractionDigits = 2) =>
  `${n >= 0 ? '+' : ''}${n.toFixed(fractionDigits)}%`;

export const formatRelativeTime = (date: Date) => {
  // "32s ago", "5m ago", "2h ago", "3d ago"
  // Use date-fns formatDistanceToNowStrict if convenient.
};
```

---

# 11. Claude Code Configuration

## 11.1 CLAUDE.md (project root, in `.claude/CLAUDE.md`)

🔴 **MUST** — Place the following content (Claude Code reads it automatically every session):

```markdown
# CRPC Website — Claude Code Project Rules

## Mission
Build the CRPC public website MVP per `docs/CRPC_Website_Spec_MVP.md`.

## Always
- TypeScript strict.
- English-only UI strings via next-intl.
- Dark theme only.
- Responsive: 375 / 768 / 1280.
- Numeric values via `src/lib/format.ts`.
- All times in UTC.

## Never
- Add Japanese strings or `ja` locale.
- Add wallet-connection libraries (RainbowKit, wagmi, viem) in MVP.
- Hard-code English text in components. Use `messages/en.json`.
- Use `<form>` with native submission.
- Commit secrets.
- Add light/dark toggle.

## Always run before declaring done
pnpm lint && pnpm typecheck && pnpm build

## Where things live
- Pricing formula: src/lib/pricing.ts
- All constants: src/config/constants.ts
- Supabase clients: src/lib/supabase/{client,server,admin}.ts
- Public API routes: src/app/api/...
- Admin pages: src/app/admin/...

## When stuck
Read docs/CRPC_Website_Spec_MVP.md (the canonical spec).
```

## 11.2 Recommended Skills

🟡 **SHOULD** — Create these as `.claude/skills/<name>/SKILL.md`:

### `verify-build/SKILL.md`

```markdown
---
name: verify-build
description: Run pnpm lint, typecheck, build sequentially. Use after any significant code change.
---

# Verify Build

Run the following:
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm build`

If any step fails, stop and report the error. Do not auto-fix lint errors without showing them first.
```

### `check-spec/SKILL.md`

```markdown
---
name: check-spec
description: Look up a topic in the MVP spec. Use whenever uncertain about expected behavior, naming, or rules.
---

# Check Spec

Open `docs/CRPC_Website_Spec_MVP.md` and find the section relevant to the user's question.
Cite the section number when responding.
```

---

# 12. Environment Variables

🔴 **MUST** — Create `.env.example` (committed) and `.env.local` (NOT committed):

```bash
# .env.example
NEXT_PUBLIC_SITE_URL=https://crpc.example.com

# Pricing parameters (provided by 堤様)
NEXT_PUBLIC_PRICE_PARAM_A=0
NEXT_PUBLIC_PRICE_PARAM_B=0
NEXT_PUBLIC_PRICE_PARAM_C=0

# Contract
NEXT_PUBLIC_CRPC_CONTRACT_ADDRESS=0x61c4d061149fd7a559e021c8dffcfb364ffded1a

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External APIs
ETHERSCAN_API_KEY=
COINGECKO_API_KEY=

# DigiFinex (public endpoints only; no API key needed for ticker)
DIGIFINEX_SYMBOL=crpc_usdt
```

🚫 **PROHIBITED** — Committing `.env.local`.
🔴 **MUST** — Add `.env.local` to `.gitignore`.

---

# 13. Implementation Order

This is the order Claude Code should follow. Each step has a clear verification checkpoint.

| Step | Task | Verification |
|---|---|---|
| 0 | `pnpm create next-app` with TS + Tailwind + App Router; install shadcn/ui, next-intl, next-themes, recharts, supabase | `pnpm dev` shows default page |
| 1 | Set up `.claude/CLAUDE.md`, skills | Files exist |
| 2 | Set up i18n with English-only locale + `messages/en.json` | `useTranslations` works |
| 3 | Tailwind config: colors, fonts | Dark page renders correctly |
| 4 | Layout components: Header, Footer, GeoNotice | All pages share them |
| 5 | Apply Supabase migration `0001_initial.sql` | Tables exist; RLS active |
| 6 | Implement `src/lib/pricing.ts` + tests (manual or vitest) | Sample J → expected V |
| 7 | Implement `src/lib/supabase/*` and `src/lib/digifinex.ts`, `src/lib/coingecko.ts` | Can fetch latest J, latest market price |
| 8 | M-1 Dashboard (incl. 4 cards + 3 mini-charts) | Page renders with real data |
| 9 | M-2 / M-3 / M-4 history pages | Charts render past data |
| 10 | M-5 About page | Static content rendered |
| 11 | M-6 Trade guide | External link works |
| 12 | M-8 Roadmap page | Static content rendered |
| 13 | `/terms` placeholder page | Renders with TBD note |
| 14 | Middleware + `/admin/login` | Unauthorized users blocked from `/admin` |
| 15 | `/admin` dashboard + audit log view | Logged-in admin sees latest J |
| 16 | `/admin/point-balance` form + POST API + `revalidateTag` | New J appears on public dashboard within seconds |
| 17 | `vercel.json` cron for market price | After deploy, cron records every minute |
| 18 | Final lint + typecheck + build | All green |
| 19 | Deploy to Vercel | Live URL accessible |

🔴 **MUST** — Do not skip steps or batch them carelessly. Each step's verification is the gate.

---

# 14. Verification Commands

🔴 **MUST** — These commands should all pass before claiming MVP complete.

```bash
# Lint, types, build
pnpm lint
pnpm typecheck
pnpm build

# Local DB
supabase start          # Optional: local Supabase via CLI
supabase db reset        # Re-applies migrations

# Smoke test (after dev server is running on :3000)
curl -s http://localhost:3000/api/market-price | jq
curl -s http://localhost:3000/api/point-balance/latest | jq
curl -s http://localhost:3000/api/theoretical-price/latest | jq

# Visual checks
# Open http://localhost:3000 and verify:
# - Dashboard shows V, J, market price, deviation
# - All "Last updated" timestamps are present
# - GeoNotice visible at top and in footer
# - All pages responsive at 375 / 768 / 1280
# - /admin redirects to /admin/login when unauthenticated
# - After login, /admin shows latest J
# - Inserting a new J updates dashboard within 60s
```

---

# 15. Known Risks & Open Items

| # | Item | Owner | Resolution Path |
|---|---|---|---|
| R-1 | CRPC contract (v0.3.5) compatibility with future DEX integration | 堤様 + dev | CRPC v2 reissue (Phase 2). For MVP, no on-chain interaction beyond reading. |
| R-2 | DigiFinex symbol for CRPC ("crpc_usdt") not yet confirmed | dev | Hit DigiFinex `/v3/markets` symbols endpoint before launch; adjust `DIGIFINEX_SYMBOL` env var. |
| R-3 | DigiFinex KYC effectively blocks Japan residents — needs confirmation | 堤様 | Confirm with DigiFinex during MVP launch window. |
| R-4 | Pricing parameters a, b, c values not yet provided | 堤様 | Provide values before pricing logic implementation (Step 6). |
| R-5 | Terms of Service text needs legal counsel review | 堤様 + legal | Placeholder until Phase 1.5. Add visible "DRAFT" badge in MVP. |
| R-6 | First J value not yet provided | 堤様 | Provide value before deploy; seed via admin UI on first login. |
| R-7 | Logo SVG to be supplied | 堤様 | Place at `public/logo.svg` before launch. |
| R-8 | Singapore CRPC entity not yet incorporated → site runs under 堤様 personal accounts initially | 堤様 | Plan domain & Vercel account transfer for Phase 2. |
| R-9 | Vercel cron requires Pro plan in some configurations | dev | Verify cron availability on Hobby tier; otherwise upgrade or use Supabase Edge Functions scheduled trigger. |
| R-10 | Light-load Etherscan API usage in MVP; may need key in higher volume | dev | Free tier sufficient for MVP. |

---

# 16. Out-of-Scope Reminder

The following are explicitly **not** in MVP scope. Do not implement them even if tempted.

- Wallet connect / DEX swap UI
- Multi-language (only `en` locale active; no UI toggle)
- Light theme toggle
- Reserve composition dashboard
- Wallet address publication (Treasury, Reserve, Operating, Option Pool)
- Audit report PDF uploads
- KYC, payments, on-site trading
- Multi-admin workflows (single admin: 堤様 only)
- Email notifications
- Mobile native app
- Real-time WebSocket pricing (1-minute polling is sufficient)

When 堤様 decides to move to Phase 1.5 or Phase 2, a new spec will be drafted.

---

**End of MVP Specification**
