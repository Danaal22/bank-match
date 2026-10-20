---
name: Vercel deployment constraints
description: Why Vercel overrides must explicitly select a compatible pnpm version
---

Explicitly select the supported pnpm version for both installation and build when overriding Vercel commands.

**Why:** Vercel's package-manager documentation says a bare overridden `pnpm install` can select its oldest available pnpm, rather than the version inferred from the lockfile. That can break this workspace's catalogs and release-age security policy.

**How to apply:** Keep the install/build version selection consistent with the package-manager declaration. Do not remove the supply-chain release-age policy to fix a Vercel install.

