# Bank Match

Arabic-first banking product comparison for people in Kuwait: needs quiz, preference matching, transparent annual fee estimates, sourced product details, and travel comparison.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — managed API workflow
- `pnpm --filter @workspace/bank-match run dev` — managed website workflow
- `pnpm --filter @workspace/api-server run test:matching` — deterministic ranking and financial-calculation checks, without DB writes or AI calls
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run build:vercel` — production frontend + bundled serverless Express entry; does not migrate databases
- `pnpm run test:vercel` — exercise the compiled serverless entry against the configured database (seeds public catalog); disable AI keys for the no-key fallback assertion
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional enhancement: Replit-managed OpenRouter AI integration. The rule-based recommendation engine remains available without it.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bank-match/` — RTL React website.
- `artifacts/api-server/src/lib/bank-catalog.ts` — initial official-source catalog; existing database rows are not overwritten on startup.
- `artifacts/api-server/src/lib/bank-matching.ts` — database catalog loading.
- `artifacts/api-server/src/lib/matching-engine.ts` and `cashback-calculation.ts` — pure scoring, ordering and annual-cost math.
- `artifacts/api-server/src/lib/bank-catalog-enrichment.ts` — reviewed source-backed data updates, applied once by catalog revision.
- `artifacts/api-server/src/lib/verified-fee-updates.ts` — reviewed tariff fees, conditional currency-card treatment, and source notes.
- `artifacts/api-server/src/lib/product-verification.ts` — field-level official citations/dates, documented eligibility rules and reviewed rewards.
- `artifacts/api-server/src/lib/recommendation-explanation.ts` — optional Arabic OpenRouter explanations with fallback.
- `lib/db/src/schema/bank-products.ts` — banks and product records.
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after changes.

## Architecture decisions

- Quiz responses and results are kept only for the browser tab session, not stored in the shared product database.
- AI is for explanatory text, not fee calculation, ranking, or invented financial facts.
- Core recommendations never await AI. Extra explanation is requested explicitly, cached temporarily and rate/concurrency limited; unavailable AI does not block matching.
- Optional, non-overlapping category amounts support conditional cashback scenarios. They are subsets of monthly spend, not extra spending.
- Paid prepaid reload frequency is an explicit quiz input. Calculate verified recurring reload fees; a zero count is a user-declared usage/exemption scenario, not a claim that unknown fees are free.
- Display calculable fees before unmodeled rewards; reserve partial-cost warnings for unknown applicable fees. Currency cards remain partial when currency/funding details are absent.
- Explicit first priority controls ranking; old inputs retain low-fee precedence. Optional age/salary/nationality fields are checked only against sourced rules, never inferred from spending.
- Earned cashback is separate from deductible cashback. Unknown redemption thresholds remain null, and the earned amount is not subtracted from fees without verified redemption conditions.
- Catalog reads share a 30-second cache and in-flight request; failures propagate rather than serving fabricated or indefinitely stale data. Browser queries also use a finite 30-second freshness window.
- The schema carries Arabic and English names to support later English localization; the present interface is Arabic.

## Product

- Quiz: persona, total monthly spending, international subset, trips, paid prepaid reloads, bank type, product type, priorities.
- Up to three eligible catalog matches, with a transparent preference score and known annual fees.
- Product details, official links, verification dates, conditional benefits and missing data.
- Traveler preset and side-by-side comparison of selected recommendations.
- Six Kuwait banks with two or three initial products each.

## User preferences

- Build a functional Arabic responsive website, not a static mockup.
- Never invent bank information; unavailable facts must remain visibly unavailable.
- Recommendations are guidance only; users must verify terms and fees with the bank.
- Do not publish changes automatically; the user must review them first.
- External Vercel setup is documented in `docs/vercel-deployment.md`. It requires a reachable PostgreSQL database with schema prepared separately; no credentials are committed or transferred by the build.
- Visual direction: a distinctive professional fintech identity with deep navy, ivory, calm green, and a restrained accent; no excessive gradients or random decorative circles.
- Arabic typography must be comfortably readable with balanced spacing and correct RTL. Use IBM Plex Sans Arabic or Tajawal.
- Design revisions must preserve all working features and bank data, and use real implementation rather than a visual-only mockup.

## Gotchas

- Use managed artifact workflows; they supply the API and website ports and routing.
- Product catalog schema changes go through the normal Drizzle development schema push.
- Product data verification and costing conventions: see `.agents/memory/catalog-integrity.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
