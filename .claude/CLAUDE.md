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
