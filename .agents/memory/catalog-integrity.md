---
name: Catalog integrity
description: Financial data verification and calculation decisions for Bank Match
---

Conflicting official sources must not be resolved by silently choosing one fee. Leave the effective value unknown, cite both sources, and explain the conflict until confirmed by the bank.

**Why:** Official KFH product and tariff information disagreed during the initial research; the user explicitly forbids invented banking facts.

**How to apply:** Review both product pages and tariffs before updating fees. A newly accessed page is not proof that a conflicting tariff is obsolete.

Monthly international spending is a subset of total monthly spending, not an additional amount. Conditional cashback is not assumed to apply to all spending, and unavailable fees are never represented as free.

**Why:** A single monthly spending total does not reveal merchant categories, caps, point-redemption eligibility, or card-currency combinations.

**How to apply:** If an applicable fee is unknown, keep the estimate partial and never headline a known subtotal as the final cost. If fees are sufficiently verified but rewards cannot be modeled, show the fee estimate clearly **before unmodeled rewards**, rather than calling the entire result incomplete. Deduct a conditional reward only when verified rules and explicit, non-overlapping category inputs support the estimate. Apply thresholds, caps and redemption minimums; keep deposits and minimum balances separate from fees.

Sufficiently documented recurring fees should produce a useful gross estimate even when reward conversion or caps remain unknown. Paid prepaid reloads must be an explicit usage assumption, not silently omitted or presumed exempt.

**Why:** The user explicitly rejected blanket “incomplete cost” displays when documented fees support an estimate. Official prepaid reload charges can change the cheapest-card order.

**How to apply:** Separate missing mandatory fees from unmodeled benefits, disclose paid reload frequency and documented exemptions, and avoid claiming a final net saving when reward rules are incomplete. Foreign-currency cards still require currency and funding information even for local purchases.

The user's explicit first priority controls ranking. If the first priority is lower fees, numeric estimated-cost ordering takes precedence over the fit score. Unknown mandatory fees must not make a product appear cheaper than products with calculable fees.

**Why:** The user asked for ascending cost ordering for a low-fee priority, then clarified that ranking must follow the priority they actually choose, not an automatic preference for a secondary benefit.

**How to apply:** Honor an explicit first-priority choice; retain low-fee precedence only for legacy inputs without one. Explain the policy, distinguish calculable fees from unknown rewards, and disclose assumptions. Unrequested travel benefits must not inflate the score. A cashback ranking is modeled earned return, not proof of lowest cost or actual cash redemption.

An unknown redemption threshold must not be treated as zero, even when a reward's earning rate and cap are known.

**Why:** The user requires verified eligibility conditions and forbids interpreting unknowns as zero. A published reward-earning rule is not proof the customer can redeem the annual amount.

**How to apply:** Show calculable earned rewards separately, but do not deduct them from fees unless redemption conditions support it. Keep a useful gross fee estimate instead of falsely claiming either a guaranteed net saving or wholly unknown fees.

The catalog scope is 5–6 Kuwaiti banks, with both cards and accounts for each bank («لكل بنك بطاقات وحسابات»).

**Why:** The user explicitly requested coverage of both product types at every included bank, not just across the catalog as a whole.

**How to apply:** Check coverage per bank when adding products. Preserve unknown fees and distinguish an opening deposit from an ongoing balance requirement.

Visually verify critical Arabic tariff numbers and table scope when extraction is ambiguous.

**Why:** A bank tariff's extracted text misread a percentage, and account-page text placed business balance charges near individual-account terms. Both could create plausible but wrong retail estimates.

**How to apply:** Check the original row and headings before recording a fee. Do not trust OCR alone or carry business-account charges over to individual accounts.
