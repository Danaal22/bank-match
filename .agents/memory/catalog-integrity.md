---
name: Catalog integrity
description: Financial data verification and calculation decisions for Bank Match
---

Conflicting official sources must not be resolved by silently choosing one fee. Leave the effective value unknown, cite both sources, and explain the conflict until confirmed by the bank.

**Why:** Official KFH product and tariff information disagreed during the initial research; the user explicitly forbids invented banking facts.

**How to apply:** Review both product pages and tariffs before updating fees. A newly accessed page is not proof that a conflicting tariff is obsolete.

Monthly international spending is a subset of total monthly spending, not an additional amount. Conditional cashback is not assumed to apply to all spending, and unavailable fees are never represented as free.

**Why:** A single monthly spending total does not reveal merchant categories, caps, point-redemption eligibility, or card-currency combinations.

**How to apply:** Keep estimates partial when facts are missing. Deduct a conditional reward only when verified rules and explicit, non-overlapping category inputs support the estimate. Apply thresholds, caps and redemption minimums; keep deposits and minimum balances separate from fees.

When users select lower fees alongside other priorities, numeric estimated-cost ordering takes precedence over the fit score. Unknown mandatory fees must not make a product appear cheaper than products with calculable fees.

**Why:** The user explicitly asked for ascending annual-cost ordering when lower fees is selected. A high preference score is not a substitute for this order.

**How to apply:** Explain the ordering policy alongside results, distinguish calculable fees from unknown rewards, and disclose the assumptions behind conditional net-cost estimates. A cashback-only ranking is a ranking of modeled returns, not proof of the lowest total cost.
