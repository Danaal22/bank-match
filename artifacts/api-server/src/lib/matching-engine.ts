import type { GetBankProductResponse, GetBankRecommendationsBody } from "@workspace/api-zod";
import { estimateCashback, roundKwd } from "./cashback-calculation";
import { evaluateEligibility } from "./eligibility";

export type Answers = ReturnType<typeof GetBankRecommendationsBody.parse>;
type Product = ReturnType<typeof GetBankProductResponse.parse>;
export type CatalogProduct = { product: Product; tags: string[] };

export function validateAnswers(a: Answers): string | null {
  if (a.primaryPriority && !a.priorities.includes(a.primaryPriority)) return "الأولوية الأولى يجب أن تكون ضمن الميزات المختارة.";
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
  if (p.productType === "card" && !tags.includes("prepaid") && a.repaymentMode && a.repaymentMode !== "full") missing.push("تكلفة تمويل الرصيد غير المسدد تتطلب الرصيد ومدة السداد؛ لم نفترض السداد الكامل");
  const reloads = a.monthlyPaidPrepaidReloads ?? 1;
  const reloadNeeded = tags.includes("prepaid") && reloads > 0;
  if (reloadNeeded && p.prepaidReloadFeeKwd === null) missing.push("رسم إعادة التعبئة المدفوعة غير متوفر حاليًا");
  const feesComplete = missing.length === 0;
  const annual = p.annualFeeKwd ?? 0;
  const foreign = roundKwd(foreignNeeded ? a.internationalMonthlySpendKwd * 12 * (p.foreignTransactionFeePercent ?? 0) / 100 : 0);
  const reward = estimateCashback(p, a);
  const other = roundKwd(reloadNeeded ? reloads * 12 * (p.prepaidReloadFeeKwd ?? 0) : 0);
  if ((tags.includes("cashback") || p.cashbackProgram) && !reward.estimated) missing.push("عائد الكاش باك غير قابل للتقدير بالبيانات المتاحة");
  if (reward.estimated && !reward.deductible) missing.push("حد استبدال المكافآت غير متوفر؛ العائد المكتسب معروض ولم يخصم");
  const knownNet = roundKwd(annual + foreign + other - (reward.deductible ? reward.annualKwd : 0));
  const annualTerm = p.annualFeeKwd === null ? "رسم سنوي غير متوفر حاليًا" : `${annual} د.ك`;
  const foreignTerm = p.productType === "account" ? "رسوم خدمات الحساب والبطاقة المرتبطة غير مشمولة"
    : !foreignNeeded ? "0 د.ك (لا إنفاق دولي بالبطاقة)"
      : p.foreignTransactionFeePercent === null ? "رسم عملات غير متوفر حاليًا"
        : `(${a.internationalMonthlySpendKwd} × 12 × ${p.foreignTransactionFeePercent}/100) د.ك`;
  const rewardTerm = reward.deductible ? `${reward.annualKwd} د.ك استرداد مشروط` : reward.estimated ? `${reward.annualKwd} د.ك عائد مكتسب؛ لم يخصم لأن حد الاستبدال غير متوفر` : "لا نخصم استردادًا غير قابل للحساب";
  const reloadTerm = !tags.includes("prepaid") ? "لا تنطبق إعادة التعبئة على هذا المنتج"
    : !reloads ? "لا تعبئات مدفوعة وفق إجابتك؛ يلزم استخدام طريقة معفاة موثقة أو عدم إعادة التعبئة"
      : p.prepaidReloadFeeKwd === null ? "رسم إعادة التعبئة غير متوفر حاليًا"
        : `${reloads} × 12 × ${p.prepaidReloadFeeKwd} = ${other} د.ك`;
  const resultTerm = !feesComplete ? `صافي الأجزاء المعلومة فقط: ${knownNet} د.ك؛ لا يمثل التكلفة النهائية.`
    : `التكلفة السنوية المقدرة ${reward.deductible ? "بعد الاسترداد المشروط" : "دون خصم مكافآت غير محسوبة أو غير مؤكدة الاستبدال"}: ${knownNet} د.ك.`;
  return {
    summary: `${feesComplete ? "تقدير لسنة تجديد وفق استخدامك" : "الأجزاء المعلومة فقط، وليست إجماليًا"}؛ ${reward.deductible ? "بعد الاسترداد المشروط مع افتراض استبداله عند استحقاقه" : "لم نخصم مكافآت غير محسوبة أو غير مؤكدة الاستبدال"}. لا يشمل الإصدار أو السحب أو التمويل.`,
    knownAnnualFeesKwd: annual,
    knownAnnualForeignFeesKwd: foreign,
    knownAnnualOtherFeesKwd: other,
    knownAnnualCashbackKwd: reward.annualKwd,
    knownNetAnnualCostKwd: knownNet,
    feesComplete, cashbackEstimated: reward.estimated, cashbackDeducted: reward.deductible, cashbackNote: reward.note,
    complete: missing.length === 0, missing,
    calculationNote: [
      `الرسم السنوي: ${annualTerm}؛ رسوم المعاملات الأجنبية: ${foreignTerm}؛ إعادة التعبئة: ${reloadTerm}؛ الاسترداد: ${rewardTerm}.`,
      `${resultTerm} القاعدة: الرسوم السنوية + رسوم الإنفاق الدولي + التعبئة المدفوعة − الاسترداد المؤكد الاستبدال وفق الشروط الموثقة.`,
      !feesComplete ? "المجهول مستبعد من المجموع المعلوم وليس مجانيًا." : "",
      a.repaymentMode && a.repaymentMode !== "full" && !tags.includes("prepaid") && p.productType === "card"
        ? "لم نفترض السداد الكامل؛ رسوم التمويل غير قابلة للحساب دون الرصيد ومدة السداد."
        : "سيناريو مشتريات مع سداد كامل عند الاستحقاق وثبات الإنفاق.",
      "التقدير لسنة تجديد؛ يستبعد الإصدار والسحب النقدي وفروق الصرف والخدمات العرضية. الإيداع والحد الأدنى للرصيد ليسا رسومًا.",
      `عدد التعبئات المدفوعة شهريًا ${reloads}${a.monthlyPaidPrepaidReloads === undefined ? " (افتراض عملية واحدة؛ يمكنك تعديله في الاختبار)" : " وفق إجابتك"}.`,
    ].filter(Boolean).join(" "),
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
  const primary = primaryPriority(a);
  const priorities = [...new Set(a.priorities)].sort((x, y) => {
    const order = (p: Answers["priorities"][number]) => p === primary ? 0 : 1;
    return order(x) - order(y) || x.localeCompare(y);
  });
  const eligible = catalog.filter(({ product: p, tags }) =>
    (a.bankPreference === "any" || p.shariaStatus === a.bankPreference)
    && (a.productPreference === "any" || p.productType === a.productPreference)
    && !(a.job === "student" && tags.includes("salary"))
    && evaluateEligibility(p, a).status !== "not_met");
  const costs = new Map(eligible.map((item) => [item.product.id, annualCost(item, a)]));
  const bestReturn = Math.max(0, ...[...costs.values()].filter((c) => c.cashbackEstimated).map((c) => c.knownAnnualCashbackKwd));
  const results = eligible.map((item) => {
    const { product: p, tags } = item;
    const cost = costs.get(p.id)!;
    const eligibilityCheck = evaluateEligibility(p, a);
    const scoreBreakdown: { label: string; weight: number; earned: number }[] = [];
    const reasons = new Map<string, string>();
    const add = (label: string, weight: number, fit: number) => scoreBreakdown.push({ label, weight: roundKwd(weight), earned: roundKwd(weight * Math.min(1, Math.max(0, fit))) });
    for (const priority of priorities) {
      let fit = 0;
      if (priority === "low_fees") {
        fit = costUtility(cost, a);
        reasons.set("cost", cost.feesComplete
          ? `التكلفة التقديرية لهذه البطاقة نحو ${cost.knownNetAnnualCostKwd} د.ك سنويًا وفقًا لاستخدامك${cost.cashbackDeducted ? " بعد الاسترداد المشروط" : " قبل مكافآت غير محسوبة أو غير مؤكدة الاستبدال"}.`
          : "التكلفة غير مكتملة؛ لا يمكن اعتبار الرسوم المجهولة منخفضة.");
      } else if (priority === "cashback") {
        fit = cost.cashbackEstimated ? (bestReturn ? cost.knownAnnualCashbackKwd / bestReturn : 0) : tags.includes("cashback") ? 0.15 : 0;
        if (cost.cashbackEstimated) reasons.set("reward", `استرداد سنوي مشروط مقدر ${cost.knownAnnualCashbackKwd} د.ك على الفئات التي أدخلتها.`);
        else if (tags.includes("cashback")) reasons.set("reward", "لديه برنامج مكافآت؛ ترتيب العائد غير محسوم دون فئات إنفاق وشروط قابلة للحساب.");
      } else if (priority === "travel") {
        fit = travelFit(p, a);
        const documentedBenefit = p.features.find(f => /قاعات|صالات/.test(f)) ?? p.features.find(f => /تأمين(?: طبي)? (?:سفر|للسفر)/.test(f));
        const evidence = documentedBenefit ?? (/قاعات|مطارات/.test(p.features.join(" ")) ? "دخول قاعات وفق الشروط"
            : /عملات|عملة أجنبية/.test(p.features.join(" ")) ? "مزايا بطاقة العملات الأجنبية" : "مقارنة رسم العملات");
        if (fit > 0) reasons.set("travel", `${evidence}؛ لديك ${a.tripsPerYear} رحلات مخططة. الرسم السنوي ${p.annualFeeKwd === null ? "غير متوفر" : `${p.annualFeeKwd} د.ك`} والعملات ${p.foreignTransactionFeePercent === null ? "غير متوفرة" : `${p.foreignTransactionFeePercent}٪`} على إنفاقك الدولي ${a.internationalMonthlySpendKwd} د.ك شهريًا.`);
      } else if (priority === "sharia") {
        fit = p.shariaStatus === "islamic" ? 1 : 0;
        if (fit) reasons.set("bank", "منتج إسلامي يتفق مع أولوية التعامل المتوافق مع الشريعة.");
      } else {
        fit = p.productType === priority ? 1 : 0;
        if (fit) reasons.set("type", p.productType === "card" ? "بطاقة تتفق مع أولوية البطاقات." : "حساب يتفق مع أولوية الحسابات.");
      }
      add(labels[priority], priorities.length === 1 ? 80 : priority === primary ? 60 : 20 / (priorities.length - 1), fit);
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
      ? cost.complete ? "تقدير متكرر يخضع للأهلية وشروط البنك." : cost.cashbackEstimated && !cost.cashbackDeducted
        ? "العائد المكتسب مقدّر لكنه لم يخصم لعدم تحقق بيانات الاستبدال." : "الرسوم قابلة للحساب؛ لم نخصم مكافآت غير قابلة للتقدير."
      : "التكلفة جزئية وتحتاج تأكيد الرسوم من البنك.";
    const totalEarned = scoreBreakdown.reduce((s, part) => s + part.earned, 0);
    const totalWeight = scoreBreakdown.reduce((s, part) => s + part.weight, 0);
    return {
      eligibilityCheck,
      product: p, annualCost: cost,
      matchPercent: Math.max(0, Math.min(100, Math.round(totalEarned / Math.max(1, totalWeight) * 100))),
      scoreBreakdown, reasons: uniqueReasons, recommendationText: `${first} ${caveat}`,
    };
  });
  return results.sort((x, y) => {
    if (primary === "low_fees") {
      const certainty = Number(y.annualCost.feesComplete) - Number(x.annualCost.feesComplete);
      if (certainty) return certainty;
      if (x.annualCost.feesComplete) {
        const difference = x.annualCost.knownNetAnnualCostKwd - y.annualCost.knownNetAnnualCostKwd;
        if (difference) return difference;
      }
    } else if (primary === "cashback" && a.cashbackSpending) {
      const known = Number(y.annualCost.cashbackEstimated) - Number(x.annualCost.cashbackEstimated);
      if (known) return known;
      const reward = y.annualCost.knownAnnualCashbackKwd - x.annualCost.knownAnnualCashbackKwd;
      if (reward) return reward;
    }
    return y.matchPercent - x.matchPercent
      || Number(y.annualCost.feesComplete) - Number(x.annualCost.feesComplete)
      || (x.annualCost.feesComplete && y.annualCost.feesComplete ? x.annualCost.knownNetAnnualCostKwd - y.annualCost.knownNetAnnualCostKwd : 0)
      || x.product.id.localeCompare(y.product.id);
  }).slice(0, 3);
}

export function rankingPolicy(a: Answers) {
  if (primaryPriority(a) === "low_fees") return "أولويتك الأولى الرسوم الأقل: الرسوم القابلة للحساب أولًا، ثم التكلفة من الأقل للأعلى، ثم درجة المطابقة. الرسوم الناقصة ليست صفرًا؛ لا تخصم مكافآت غير محسوبة. لا يشمل التقدير رسوم الإصدار أو التمويل أو السحب.";
  if (primaryPriority(a) === "cashback" && a.cashbackSpending) return "أولويتك الأولى الكاش باك: العائد السنوي المشروط للفئات المدخلة من الأعلى للأقل، ثم درجة المطابقة؛ البرامج غير القابلة للحساب لاحقًا. أعلى عائد لا يعني أقل تكلفة.";
  if (primaryPriority(a) === "cashback") return "لا يكفي إجمالي الإنفاق لترتيب العائد النقدي بدقة؛ أدخل تفصيل المصاريف في خطوة الأولويات. الترتيب الحالي وفق الملاءمة والمزايا الموثقة دون افتراض عائد.";
  return "الترتيب حسب درجة المطابقة الموزونة لأهدافك ونمط استخدامك ومصروفاتك وتكرار السفر؛ لا حسب أعلى نسبة إعلانية.";
}

export function primaryPriority(a: Answers) {
  return a.primaryPriority ?? (a.priorities.includes("low_fees") ? "low_fees" : a.priorities.includes("cashback") ? "cashback" : [...a.priorities].sort()[0]!);
}

export const matchingMethodology = "نصفّي نوع البنك والمنتج والتعارضات مع شروط أهلية منشورة؛ البيانات غير المدخلة ليست إثبات أهلية. الدرجة: 80 نقطة للأولوية الوحيدة، أو 60 للأولى و20 لبقية الأولويات مجتمعة، مع 10 لنمط المستخدم و10 لموثوقية حساب الرسوم. لا نقاط لسفر غير مطلوب. الأولوية الأولى هي التي تختارها صراحة؛ للطلبات القديمة فقط تكون الرسوم الأقل أولًا إن اختيرت. نسبة المطابقة ليست احتمال قبول البنك. نحسب الرسوم المتكررة والتعبئات المدفوعة والكاش باك المؤهل فقط؛ لا نستبدل المجهول بصفر. التقدير لسنة تجديد ومشتريات وسداد كامل، وليس سنة إصدار أو تمويل أو سحب نقدي. نعرض أقل من ثلاثة إذا لم تكف الخيارات.";
export type RankedProducts = ReturnType<typeof rankProducts>;
