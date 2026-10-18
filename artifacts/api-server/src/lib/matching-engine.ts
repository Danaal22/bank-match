import type { GetBankProductResponse, GetBankRecommendationsBody } from "@workspace/api-zod";
import { estimateCashback, roundKwd } from "./cashback-calculation";

export type Answers = ReturnType<typeof GetBankRecommendationsBody.parse>;
type Product = ReturnType<typeof GetBankProductResponse.parse>;
export type CatalogProduct = { product: Product; tags: string[] };

export function validateAnswers(a: Answers): string | null {
  if (a.internationalMonthlySpendKwd > a.monthlySpendKwd) return "الإنفاق الدولي جزء من إجمالي الإنفاق، ويجب ألا يتجاوزه.";
  if (a.cashbackSpending && roundKwd(Object.values(a.cashbackSpending).reduce((s, n) => s + (n ?? 0), 0)) > a.monthlySpendKwd) {
    return "مجموع فئات الكاش باك يجب ألا يتجاوز إجمالي الإنفاق الشهري؛ لا تكرر المعاملة في أكثر من فئة.";
  }
  return null;
}

export function annualCost({ product: p, tags }: CatalogProduct, a: Answers) {
  const missing: string[] = [];
  if (p.annualFeeKwd === null) missing.push("الرسم السنوي غير متوفر حاليًا أو متعارض");
  const foreignNeeded = p.productType === "card" && a.internationalMonthlySpendKwd > 0;
  if (foreignNeeded && p.foreignTransactionFeePercent === null) missing.push("رسم معاملات العملات الأجنبية غير متوفر حاليًا");
  if (tags.includes("currency") && a.monthlySpendKwd > 0) missing.push("تكلفة عملة البطاقة وتمويلها تتطلب معرفة عملة البطاقة والشراء؛ قد تنطبق حتى على الاستخدام المحلي");
  if (p.productType === "account") missing.push("رسوم خدمات الحساب والبطاقة المرتبطة غير مشمولة");
  const reloads = a.monthlyPaidPrepaidReloads ?? 1;
  const reloadNeeded = tags.includes("prepaid") && reloads > 0;
  if (reloadNeeded && p.prepaidReloadFeeKwd === null) missing.push("رسم إعادة التعبئة المدفوعة غير متوفر حاليًا");
  const feesComplete = missing.length === 0;
  const annual = p.annualFeeKwd ?? 0;
  const foreign = roundKwd(foreignNeeded ? a.internationalMonthlySpendKwd * 12 * (p.foreignTransactionFeePercent ?? 0) / 100 : 0);
  const reward = estimateCashback(p, a);
  const other = roundKwd(reloadNeeded ? reloads * 12 * (p.prepaidReloadFeeKwd ?? 0) : 0);
  if ((tags.includes("cashback") || p.cashbackProgram) && !reward.estimated) missing.push("عائد الكاش باك غير قابل للتقدير بالبيانات المتاحة");
  const knownNet = roundKwd(annual + foreign + other - reward.annualKwd);
  const annualTerm = p.annualFeeKwd === null ? "رسم سنوي غير متوفر حاليًا" : `${annual} د.ك`;
  const foreignTerm = p.productType === "account" ? "رسوم خدمات الحساب والبطاقة المرتبطة غير مشمولة"
    : !foreignNeeded ? "0 د.ك (لا إنفاق دولي بالبطاقة)"
      : p.foreignTransactionFeePercent === null ? "رسم عملات غير متوفر حاليًا"
        : `(${a.internationalMonthlySpendKwd} × 12 × ${p.foreignTransactionFeePercent}/100) د.ك`;
  const rewardTerm = reward.estimated ? `${reward.annualKwd} د.ك استرداد مشروط` : "لا نخصم استردادًا غير قابل للحساب";
  const reloadTerm = !tags.includes("prepaid") ? "لا تنطبق إعادة التعبئة على هذا المنتج"
    : !reloads ? "لا تعبئات مدفوعة وفق إجابتك؛ يلزم استخدام طريقة معفاة موثقة أو عدم إعادة التعبئة"
      : p.prepaidReloadFeeKwd === null ? "رسم إعادة التعبئة غير متوفر حاليًا"
        : `${reloads} × 12 × ${p.prepaidReloadFeeKwd} = ${other} د.ك`;
  const resultTerm = !feesComplete ? `صافي الأجزاء المعلومة فقط: ${knownNet} د.ك؛ لا يمثل التكلفة النهائية.`
    : `التكلفة السنوية المقدرة ${reward.estimated ? "بعد الاسترداد المشروط" : "دون خصم مكافآت غير محسوبة"}: ${knownNet} د.ك.`;
  return {
    knownAnnualFeesKwd: annual,
    knownAnnualForeignFeesKwd: foreign,
    knownAnnualOtherFeesKwd: other,
    knownAnnualCashbackKwd: reward.annualKwd,
    knownNetAnnualCostKwd: knownNet,
    feesComplete, cashbackEstimated: reward.estimated, cashbackNote: reward.note,
    complete: missing.length === 0, missing,
    calculationNote: `الرسم السنوي: ${annualTerm}؛ رسوم المعاملات الأجنبية: ${foreignTerm}؛ إعادة التعبئة: ${reloadTerm}؛ الاسترداد: ${rewardTerm}. ${resultTerm} القاعدة: الرسوم السنوية + رسوم الإنفاق الدولي + التعبئة المدفوعة − الاسترداد القابل للحساب. ${!feesComplete ? "المجهول مستبعد من المجموع المعلوم وليس مجانيًا. " : ""}سيناريو مشتريات على بطاقة واحدة مع سداد كامل وثبات الإنفاق؛ يستبعد الإصدار والتمويل والسحب النقدي وفروق الصرف. عدد التعبئات المدفوعة شهريًا ${reloads}${a.monthlyPaidPrepaidReloads === undefined ? " (افتراض عملية واحدة؛ يمكنك تعديله في الاختبار)" : " وفق إجابتك"}. الإيداع والحد الأدنى للرصيد ليسا رسومًا.`,
  };
}

function travelFit(p: Product, a: Answers) {
  const text = p.features.join(" ");
  const frequency = Math.min(1, a.tripsPerYear / 6);
  const visits = text.match(/(\d+)\s+(?:زيارة|زيارات)/)?.[1];
  const loungeCoverage = visits ? Math.min(1, Number(visits) / Math.max(2, a.tripsPerYear * 2)) : 0.5;
  const benefits = (/(قاعة|قاعات|مطار|مطارات)/.test(text) ? (0.3 + 0.15 * frequency) * loungeCoverage : 0)
    + (/تأمين(?: طبي)? (?:سفر|للسفر)/.test(text) ? 0.2 + 0.15 * frequency : 0)
    + (/عملات|عملة أجنبية/.test(text) ? 0.2 : 0);
  if (!a.internationalMonthlySpendKwd) return benefits;
  // Unverified FX costs never receive the same credit as a verified zero rate.
  const fx = p.foreignTransactionFeePercent === null ? 0 : Math.max(0, 1 - p.foreignTransactionFeePercent / 5);
  const feeWeight = 0.25 + Math.min(0.4, a.internationalMonthlySpendKwd / Math.max(1, a.monthlySpendKwd) * 0.4);
  return benefits * (1 - feeWeight) + fx * feeWeight;
}

const labels: Record<Answers["priorities"][number], string> = {
  cashback: "الاسترداد النقدي", low_fees: "التكلفة السنوية", travel: "مزايا ورسوم السفر",
  sharia: "التوافق الشرعي", account: "الحسابات", card: "البطاقات",
};

function costUtility(cost: ReturnType<typeof annualCost>, a: Answers) {
  if (!cost.feesComplete) return 0;
  return 1 / (1 + Math.max(0, cost.knownNetAnnualCostKwd) / Math.max(12, a.monthlySpendKwd * 12) * 20);
}

export function rankProducts(catalog: CatalogProduct[], a: Answers) {
  const priorities = [...new Set(a.priorities)].sort((x, y) => {
    const order = (p: Answers["priorities"][number]) => p === "low_fees" ? 0 : p === "cashback" ? 1 : 2;
    return order(x) - order(y) || x.localeCompare(y);
  });
  const eligible = catalog.filter(({ product: p, tags }) =>
    (a.bankPreference === "any" || p.shariaStatus === a.bankPreference)
    && (a.productPreference === "any" || p.productType === a.productPreference)
    && !(a.job === "student" && tags.includes("salary")));
  const costs = new Map(eligible.map((item) => [item.product.id, annualCost(item, a)]));
  const bestReturn = Math.max(0, ...[...costs.values()].filter((c) => c.cashbackEstimated).map((c) => c.knownAnnualCashbackKwd));
  const results = eligible.map((item) => {
    const { product: p, tags } = item;
    const cost = costs.get(p.id)!;
    const scoreBreakdown: { label: string; weight: number; earned: number }[] = [];
    const reasons = new Map<string, string>();
    const add = (label: string, weight: number, fit: number) => scoreBreakdown.push({ label, weight: roundKwd(weight), earned: roundKwd(weight * Math.min(1, Math.max(0, fit))) });
    for (const priority of priorities) {
      let fit = 0;
      if (priority === "low_fees") {
        fit = costUtility(cost, a);
        reasons.set("cost", cost.feesComplete
          ? `التكلفة التقديرية لهذه البطاقة نحو ${cost.knownNetAnnualCostKwd} د.ك سنويًا وفقًا لاستخدامك${cost.cashbackEstimated ? " بعد الاسترداد المشروط" : " قبل أي مكافآت غير محسوبة"}.`
          : "التكلفة غير مكتملة؛ لا يمكن اعتبار الرسوم المجهولة منخفضة.");
      } else if (priority === "cashback") {
        fit = cost.cashbackEstimated ? (bestReturn ? cost.knownAnnualCashbackKwd / bestReturn : 0) : tags.includes("cashback") ? 0.15 : 0;
        if (cost.cashbackEstimated) reasons.set("reward", `استرداد سنوي مشروط مقدر ${cost.knownAnnualCashbackKwd} د.ك على الفئات التي أدخلتها.`);
        else if (tags.includes("cashback")) reasons.set("reward", "لديه برنامج مكافآت؛ ترتيب العائد غير محسوم دون فئات إنفاق وشروط قابلة للحساب.");
      } else if (priority === "travel") {
        fit = travelFit(p, a);
        const evidence = /تأمين(?: طبي)? (?:سفر|للسفر)/.test(p.features.join(" ")) ? "تأمين سفر مشروط"
          : /قاعات|مطارات/.test(p.features.join(" ")) ? "دخول قاعات وفق الشروط"
            : /عملات|عملة أجنبية/.test(p.features.join(" ")) ? "مزايا بطاقة العملات الأجنبية" : "مقارنة رسم العملات";
        if (fit > 0) reasons.set("travel", `${evidence} مع ${a.tripsPerYear} رحلات مخططة؛ رسم العملات ${p.foreignTransactionFeePercent === null ? "غير متوفر حاليًا" : `${p.foreignTransactionFeePercent}٪`} على إنفاقك الدولي ${a.internationalMonthlySpendKwd} د.ك شهريًا.`);
      } else if (priority === "sharia") {
        fit = p.shariaStatus === "islamic" ? 1 : 0;
        if (fit) reasons.set("bank", "منتج إسلامي يتفق مع أولوية التعامل المتوافق مع الشريعة.");
      } else {
        fit = p.productType === priority ? 1 : 0;
        if (fit) reasons.set("type", p.productType === "card" ? "بطاقة تتفق مع أولوية البطاقات." : "حساب يتفق مع أولوية الحسابات.");
      }
      add(labels[priority], 80 / Math.max(1, priorities.length), fit);
    }
    const persona = a.job === "student" ? (tags.includes("prepaid") ? 1 : p.productType === "account" ? 0.8 : 0.25)
      : a.job === "traveler" ? (priorities.includes("travel") ? travelFit(p, a) : p.productType === "card" ? 0.75 : 0.5)
        : tags.includes("salary") || tags.includes("daily") ? 1 : tags.includes("prepaid") ? 0.85 : 0.65;
    add("نمط استخدامك", 10, persona);
    if (a.job === "student" && tags.includes("prepaid")) reasons.set("persona", "مسبقة الدفع لتحديد الميزانية، دون افتراض موافقة ائتمانية للطالب.");
    if (tags.includes("salary")) reasons.set("persona", "حساب راتب؛ يلزم تأكيد الراتب والجنسية مع البنك، فالمصروفات ليست دخلًا.");
    add("موثوقية حساب الرسوم لاستخدامك", 10, cost.feesComplete ? 1 : 0);
    if (a.bankPreference !== "any" && !reasons.has("bank")) reasons.set("bank", `نوع البنك ${p.shariaStatus === "islamic" ? "إسلامي" : "تقليدي"} وفق تفضيلك.`);
    const uniqueReasons = [...new Set(reasons.values())].slice(0, 3);
    if (!uniqueReasons.length) uniqueReasons.push("هذا خيار للمقارنة ضمن نوع البنك والمنتج المحددين؛ مزاياه المطابقة غير كافية للجزم بأفضليته.");
    const first = uniqueReasons[0]!;
    const caveat = cost.feesComplete
      ? cost.complete ? "تقدير متكرر يخضع للأهلية وشروط البنك." : "الرسوم قابلة للحساب؛ لم نخصم مكافآت غير قابلة للتقدير."
      : "التكلفة جزئية وتحتاج تأكيد الرسوم من البنك.";
    const totalEarned = scoreBreakdown.reduce((s, part) => s + part.earned, 0);
    const totalWeight = scoreBreakdown.reduce((s, part) => s + part.weight, 0);
    return {
      product: p, annualCost: cost,
      matchPercent: Math.max(0, Math.min(100, Math.round(totalEarned / Math.max(1, totalWeight) * 100))),
      scoreBreakdown, reasons: uniqueReasons, recommendationText: `${first} ${caveat}`,
    };
  });
  return results.sort((x, y) => {
    if (priorities.includes("low_fees")) {
      const certainty = Number(y.annualCost.feesComplete) - Number(x.annualCost.feesComplete);
      if (certainty) return certainty;
      if (x.annualCost.feesComplete) {
        const difference = x.annualCost.knownNetAnnualCostKwd - y.annualCost.knownNetAnnualCostKwd;
        if (difference) return difference;
      }
    } else if (priorities.includes("cashback") && a.cashbackSpending) {
      const known = Number(y.annualCost.cashbackEstimated) - Number(x.annualCost.cashbackEstimated);
      if (known) return known;
      const reward = y.annualCost.knownAnnualCashbackKwd - x.annualCost.knownAnnualCashbackKwd;
      if (reward) return reward;
    }
    return y.matchPercent - x.matchPercent || x.product.id.localeCompare(y.product.id);
  }).slice(0, 3);
}

export function rankingPolicy(a: Answers) {
  if (a.priorities.includes("low_fees")) return "أولوية الرسوم الأقل: المنتجات ذات رسوم قابلة للحساب أولًا، ثم التكلفة السنوية المقدرة من الأقل للأعلى، ثم درجة المطابقة. الرسوم الناقصة لاحقًا وليست صفرًا؛ الاسترداد يُخصم فقط للفئات المدخلة.";
  if (a.priorities.includes("cashback") && a.cashbackSpending) return "أولوية الكاش باك: العائد السنوي المشروط القابل للحساب للفئات المدخلة من الأعلى للأقل، ثم درجة المطابقة؛ البرامج غير القابلة للحساب لاحقًا.";
  if (a.priorities.includes("cashback")) return "لا يكفي إجمالي الإنفاق لترتيب العائد النقدي بدقة؛ أدخل تفصيل المصاريف في خطوة الأولويات. الترتيب الحالي وفق الملاءمة والمزايا الموثقة دون افتراض عائد.";
  return "الترتيب حسب درجة المطابقة الموزونة لأهدافك ونمط استخدامك ومصروفاتك وتكرار السفر؛ لا حسب أعلى نسبة إعلانية.";
}

export const matchingMethodology = "نصفّي نوع البنك والمنتج أولًا ولا نؤكد الأهلية. الدرجة = 80 نقطة موزعة بالتساوي على الأولويات المختارة + 10 لنمط المستخدم + 10 لقابلية حساب الرسوم من بيانات موثقة. لا تمنح مزايا السفر نقاطًا إذا لم تحدد أولوية السفر. عند جمع الرسوم الأقل والكاش باك تكون أولوية الترتيب للتكلفة، والرسوم المجهولة لاحقًا. عدم تقدير المكافآت لا يمنع عرض تقدير الرسوم المعروفة قبل المكافآت. نحسب التعبئات المدفوعة حسب العدد المدخل (الافتراضي مرة شهريًا). التكاليف متكررة وليست رسوم السنة الأولى؛ تستبعد الإصدار والتمويل والسحب وفروق الشبكة. نعرض أقل من ثلاثة إذا لم تكف المنتجات المتاحة.";
export type RankedProducts = ReturnType<typeof rankProducts>;
