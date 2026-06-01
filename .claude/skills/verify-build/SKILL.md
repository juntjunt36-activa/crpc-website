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
