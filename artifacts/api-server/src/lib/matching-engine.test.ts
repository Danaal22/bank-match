import test from "node:test";
import assert from "node:assert/strict";
import { annualCost, rankProducts, rankingPolicy, validateAnswers, type Answers, type CatalogProduct } from "./matching-engine";
import { reviewedCatalogChanges } from "./bank-catalog-enrichment";

const profile: Answers = { job: "employee", monthlySpendKwd: 1000, internationalMonthlySpendKwd: 0, tripsPerYear: 0, bankPreference: "any", productPreference: "card", priorities: ["cashback"] };
function product(id: string, changes: Partial<CatalogProduct["product"]> = {}, tags: string[] = ["cashback"]): CatalogProduct {
  const reviewed = reviewedCatalogChanges.find((p) => p.id === id);
  return {
    product: {
      id, bankNameAr: "بنك اختبار", bankNameEn: "Test", bankWebsite: "https://example.test",
      bankInitials: "T", productNameAr: "منتج اختبار", productNameEn: "Test product",
      productType: "card", category: "بطاقة", shariaStatus: "conventional",
      annualFeeKwd: 10, foreignTransactionFeePercent: 2.5, cashbackPercent: null,
      cashbackProgram: reviewed?.patch.cashbackProgram as CatalogProduct["product"]["cashbackProgram"] ?? null,
      minimumBalanceKwd: null, features: [], eligibility: "تخضع للموافقة",
      feeNotes: "اختبار", sources: [{ title: "مصدر اختبار", url: "https://example.test" }],
      lastVerified: new Date("2026-10-18"), ...changes,
    }, tags,
  };
}
const models = [product("nbk-247", {}, ["cashback", "prepaid"]), product("burgan-world", { annualFeeKwd: 150, features: ["12 زيارة لقاعات المطارات وتأمين سفر"] }, ["cashback", "travel"]), product("cbk-signature", { annualFeeKwd: 80 }, ["cashback", "travel"])];

test("annual cost uses the international subset once, and deducts only category-modeled cashback", () => {
  const c = annualCost(models[1]!, { ...profile, internationalMonthlySpendKwd: 200, cashbackSpending: { dining: 200, utilities: 100 } });
  assert.equal(c.knownAnnualFeesKwd, 150);
  assert.equal(c.knownAnnualForeignFeesKwd, 60);
  assert.equal(c.knownAnnualCashbackKwd, 180);
  assert.equal(c.knownNetAnnualCostKwd, 30);
  assert.equal(c.complete, true);
});

test("NBK category rates, delivery cap, total cap, minimum spend and redemption minimum", () => {
  const a = { ...profile, cashbackSpending: { groceries: 100, streaming: 20, delivery: 400 } };
  assert.equal(annualCost(models[0]!, a).knownAnnualCashbackKwd, 261.6);
  assert.equal(annualCost(models[0]!, { ...profile, monthlySpendKwd: 69, cashbackSpending: { streaming: 20 } }).knownAnnualCashbackKwd, 0);
  assert.equal(annualCost(models[0]!, { ...profile, monthlySpendKwd: 70, cashbackSpending: { groceries: 20 } }).knownAnnualCashbackKwd, 0);
  assert.equal(annualCost(models[0]!, { ...profile, monthlySpendKwd: 10000, cashbackSpending: { streaming: 10000 } }).knownAnnualCashbackKwd, 247 * 12);
});

test("Burgan uses eligible rather than total spend, exact tier boundary and monthly ceiling", () => {
  for (const [dining, expected] of [[99, 0], [100, 60], [1000, 600], [1000.001, 1800], [4000, 6000]]) {
    assert.equal(annualCost(models[1]!, { ...profile, monthlySpendKwd: 5000, cashbackSpending: { dining } }).knownAnnualCashbackKwd, expected);
  }
});

test("CBK tiers match the published ranges and do not invent a fractional gap tier", () => {
  for (const [spend, expected] of [[100, 12], [1000, 120], [1001, 360.36], [2000, 720], [2001, 1200.6], [20000, 6000]]) {
    assert.equal(annualCost(models[2]!, { ...profile, monthlySpendKwd: spend, cashbackSpending: { groceries: spend } }).knownAnnualCashbackKwd, expected);
  }
  assert.equal(annualCost(models[2]!, { ...profile, monthlySpendKwd: 1000.5, cashbackSpending: { groceries: 100 } }).cashbackEstimated, false);
});

test("cashback winner changes with actual categories, not the advertising maximum", () => {
  assert.equal(rankProducts(models, { ...profile, cashbackSpending: { groceries: 600 } })[0]!.product.id, "nbk-247");
  assert.equal(rankProducts(models, { ...profile, cashbackSpending: { dining: 600 } })[0]!.product.id, "burgan-world");
  assert.equal(rankProducts(models, { ...profile, cashbackSpending: { streaming: 600 } })[0]!.product.id, "nbk-247");
  assert.match(rankingPolicy(profile), /لا يكفي إجمالي/);
});

test("travel frequency and known lounge limits affect travel fit instead of treating all travel cards alike", () => {
  const catalog = [
    product("six", { features: ["6 زيارات سنوية إلى قاعات المطارات"], annualFeeKwd: 10 }, ["travel", "prepaid"]),
    product("twelve", { features: ["12 زيارة سنوية لقاعات المطارات وتأمين سفر"], annualFeeKwd: 150 }, ["travel"]),
  ];
  const a: Answers = { ...profile, job: "traveler", priorities: ["travel"], tripsPerYear: 1, internationalMonthlySpendKwd: 100 };
  const low = rankProducts(catalog, a);
  const frequent = rankProducts(catalog, { ...a, tripsPerYear: 8 });
  assert.notDeepEqual(low.map((r) => [r.product.id, r.matchPercent]), frequent.map((r) => [r.product.id, r.matchPercent]));
  assert.equal(frequent[0]!.product.id, "twelve");
});

test("lowest-fee ordering is numerical and puts unknown fees after computable costs", () => {
  const cards = [product("expensive", { annualFeeKwd: 80 }), product("partial", { annualFeeKwd: 1, foreignTransactionFeePercent: null }), product("cheap", { annualFeeKwd: 10 })];
  const ranked = rankProducts(cards, { ...profile, priorities: ["low_fees"], internationalMonthlySpendKwd: 100 });
  assert.deepEqual(ranked.map((r) => r.product.id), ["cheap", "expensive", "partial"]);
  assert.equal(ranked[2]!.annualCost.feesComplete, false);
  assert.equal(ranked[2]!.annualCost.complete, false);
});

test("a traveler selecting lower fees still gets cheaper cards before premium travel cards", () => {
  const cards = [
    product("premium", { annualFeeKwd: 150, foreignTransactionFeePercent: 3, features: ["12 زيارة لقاعات المطارات وتأمين سفر"] }, ["travel"]),
    product("basic", { annualFeeKwd: 10, foreignTransactionFeePercent: 1 }, ["prepaid"]),
    product("unknown", { annualFeeKwd: null, features: ["قاعات المطارات وتأمين سفر"] }, ["travel"]),
  ];
  const a: Answers = { ...profile, job: "traveler", tripsPerYear: 12, internationalMonthlySpendKwd: 200, priorities: ["travel", "low_fees"] };
  const ranked = rankProducts(cards, a);
  assert.deepEqual(ranked.map((r) => r.product.id), ["basic", "premium", "unknown"]);
  assert.equal(ranked[0]!.annualCost.knownNetAnnualCostKwd, 34);
  assert.match(ranked[0]!.recommendationText, /^وفق إنفاقك، التكلفة/);
  assert.deepEqual(ranked.map((r) => r.reasons), rankProducts(cards, { ...a, priorities: ["low_fees", "travel"] }).map((r) => r.reasons));
});

test("missing fees are named in calculation text instead of substituting a zero fee", () => {
  const c = annualCost(product("missing", { annualFeeKwd: null, foreignTransactionFeePercent: null }, []), { ...profile, internationalMonthlySpendKwd: 100 });
  assert.equal(c.feesComplete, false);
  assert.match(c.calculationNote, /رسم سنوي غير متوفر حاليًا/);
  assert.match(c.calculationNote, /رسم عملات غير متوفر حاليًا/);
  assert.match(c.calculationNote, /لا يمثل التكلفة النهائية/);
  assert.doesNotMatch(c.calculationNote, /التكلفة الصافية المقدرة:/);
});

test("account costs never describe unmodeled linked-card services as zero fees", () => {
  const c = annualCost(product("account", { productType: "account", annualFeeKwd: null }, ["account"]), profile);
  assert.equal(c.complete, false);
  assert.match(c.calculationNote, /رسوم خدمات الحساب والبطاقة المرتبطة غير مشمولة/);
  assert.doesNotMatch(c.calculationNote, /0 د.ك \(لا إنفاق دولي/);
});

test("low-fee ordering uses modeled net cost and takes precedence when combined with cashback", () => {
  const ranked = rankProducts(models, { ...profile, priorities: ["cashback", "low_fees"], cashbackSpending: { dining: 600 } });
  const net = ranked.map((r) => r.annualCost.knownNetAnnualCostKwd);
  assert.deepEqual(net, [...net].sort((a, b) => a - b));
  assert.match(rankingPolicy({ ...profile, priorities: ["low_fees", "cashback"] }), /أولوية الرسوم/);
});

test("hard preferences remain strict and students are not offered salary accounts", () => {
  const cards = [...models, product("islamic", { shariaStatus: "islamic" }), product("salary", { shariaStatus: "islamic", productType: "account" }, ["salary", "account"])];
  const a: Answers = { ...profile, job: "student", bankPreference: "islamic", productPreference: "any" };
  assert.deepEqual(rankProducts(cards, a).map((r) => r.product.id), ["islamic"]);
  assert.equal(rankProducts(cards, { ...a, productPreference: "account" }).length, 0);
});

test("all six priorities and combinations have auditable bounded scores and unique short reasons", () => {
  const priorities: Answers["priorities"] = ["cashback", "travel", "low_fees", "sharia", "account", "card"];
  const catalog = [...models, product("islamic", { shariaStatus: "islamic", productType: "account" }, ["account", "daily", "sharia"])];
  const orders = new Set<string>();
  for (let mask = 1; mask < 64; mask++) {
    for (const job of ["student", "employee", "traveler"] as const) {
      const a: Answers = { ...profile, job, productPreference: "any", priorities: priorities.filter((_, i) => mask & (1 << i)), tripsPerYear: 4, internationalMonthlySpendKwd: 100, cashbackSpending: { dining: 600 } };
      const ranked = rankProducts(catalog, a);
      assert.ok(ranked.length <= 3);
      orders.add(ranked.map((r) => r.product.id).join(","));
      for (const r of ranked) {
        assert.ok(r.matchPercent >= 0 && r.matchPercent <= 100);
        assert.equal(r.matchPercent, Math.round(r.scoreBreakdown.reduce((s, p) => s + p.earned, 0) / r.scoreBreakdown.reduce((s, p) => s + p.weight, 0) * 100));
        assert.equal(new Set(r.reasons).size, r.reasons.length);
        assert.ok(r.reasons.length <= 3);
        assert.ok(r.recommendationText.length < 280);
      }
    }
  }
  assert.ok(orders.size >= 3, "priorities must produce meaningfully different orders");
});

test("duplicated priorities cannot inflate scores; order is deterministic", () => {
  const a = { ...profile, priorities: ["travel", "low_fees"] as Answers["priorities"] };
  const signature = (p: Answers) => rankProducts(models, p).map((r) => [r.product.id, r.matchPercent]);
  assert.deepEqual(signature(a), signature({ ...a, priorities: ["low_fees", "travel", "travel"] }));
});

test("unknown rewards or missing breakdown are never deducted and deposits are not annual fees", () => {
  const c = annualCost(product("unmodeled", { cashbackPercent: null, minimumBalanceKwd: 500 }), profile);
  assert.equal(c.knownAnnualCashbackKwd, 0);
  assert.equal(c.knownNetAnnualCostKwd, 10);
  assert.equal(c.complete, false);
  assert.equal(annualCost(models[0]!, profile).cashbackEstimated, false);
  assert.equal(annualCost(product("zero", { annualFeeKwd: 0, foreignTransactionFeePercent: 0 }, []), profile).complete, true);
});

test("invalid international or overlapping category totals are rejected and fils remain precise", () => {
  assert.ok(validateAnswers({ ...profile, internationalMonthlySpendKwd: 1001 }));
  assert.ok(validateAnswers({ ...profile, cashbackSpending: { groceries: 600, dining: 600 } }));
  assert.equal(validateAnswers({ ...profile, monthlySpendKwd: 0.3, cashbackSpending: { groceries: 0.1, dining: 0.2 } }), null);
  const c = annualCost(product("fils", { annualFeeKwd: 10.125, foreignTransactionFeePercent: 2.5 }, []), { ...profile, internationalMonthlySpendKwd: 123.456 });
  assert.equal(c.knownAnnualForeignFeesKwd, 37.037);
  assert.equal(c.knownNetAnnualCostKwd, 47.162);
});
