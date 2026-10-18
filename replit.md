# Bank Match

Arabic-first banking product comparison for people in Kuwait: needs quiz, preference matching, transparent annual fee estimates, sourced product details, and travel comparison.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — managed API workflow
- `pnpm --filter @workspace/bank-match run dev` — managed website workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
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
- `artifacts/api-server/src/lib/bank-matching.ts` — deterministic match scoring and annual fee math.
- `artifacts/api-server/src/lib/recommendation-explanation.ts` — optional Arabic OpenRouter explanations with fallback.
- `lib/db/src/schema/bank-products.ts` — banks and product records.
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after changes.

## Architecture decisions

- Quiz responses and results are kept only for the browser tab session, not stored in the shared product database.
- AI is for explanatory text, not fee calculation, ranking, or invented financial facts.
- The schema carries Arabic and English names to support later English localization; the present interface is Arabic.

## Product

- Quiz: persona, total monthly spending, international subset, trips, bank type, product type, priorities.
- Up to three eligible catalog matches, with a transparent preference score and known annual fees.
- Product details, official links, verification dates, conditional benefits and missing data.
- Traveler preset and side-by-side comparison of selected recommendations.
- Six Kuwait banks with two or three initial products each.

## User preferences

- Build a functional Arabic responsive website, not a static mockup.
- Never invent bank information; unavailable facts must remain visibly unavailable.
- Recommendations are guidance only; users must verify terms and fees with the bank.
- Visual direction: a distinctive professional fintech identity with deep navy, ivory, calm green, and a restrained accent; no excessive gradients or random decorative circles.
- Arabic typography must be comfortably readable with balanced spacing and correct RTL. Use IBM Plex Sans Arabic or Tajawal.
- Design revisions must preserve all working features and bank data, and use real implementation rather than a visual-only mockup.

## Gotchas

- Use managed artifact workflows; they supply the API and website ports and routing.
- Product catalog schema changes go through the normal Drizzle development schema push.
- Product data verification and costing conventions: see `.agents/memory/catalog-integrity.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
