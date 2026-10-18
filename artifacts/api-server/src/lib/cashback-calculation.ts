import type { GetBankProductResponse, GetBankRecommendationsBody } from "@workspace/api-zod";

type Product = ReturnType<typeof GetBankProductResponse.parse>;
type Answers = ReturnType<typeof GetBankRecommendationsBody.parse>;
export const roundKwd = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;

export function estimateCashback(product: Product, answers: Answers) {
  const program = product.cashbackProgram;
  const unknown = { estimated: false, deductible: false, annualKwd: 0, note: "عائد نقدي قابل للحساب غير متوفر حاليًا؛ لم نفترض تحويل النقاط أو المكافآت إلى مبلغ نقدي." };
  if (!program) return product.cashbackPercent !== null && product.cashbackPercent > 0
    ? { ...unknown, note: `النسبة المعلنة ${product.cashbackPercent}٪ مشروطة؛ بيانات الفئات أو السقوف اللازمة للحساب غير مكتملة. لم نطبقها على إجمالي الإنفاق ولم نخصم عائدًا.` }
    : unknown;
  if (!answers.cashbackSpending) return { ...unknown, note: "أدخل تفصيل مصاريفك الاختياري لحساب استرداد مشروط؛ لا نطبّق النسبة الإعلانية على إجمالي الإنفاق." };
  const eligible = program.rules.reduce((sum, rule) => sum + (answers.cashbackSpending?.[rule.category] ?? 0), 0);
  const basis = program.minimumSpendBasis === "eligible" ? eligible : answers.monthlySpendKwd;
  if (basis < program.minimumMonthlySpendKwd) {
    return { estimated: true, deductible: true, annualKwd: 0, note: `الإنفاق ${program.minimumSpendBasis === "eligible" ? "المؤهل " : ""}أقل من شرط ${program.minimumMonthlySpendKwd} د.ك شهريًا؛ الاسترداد المقدر صفر.` };
  }
  const tier = program.tiers.find((t) => basis >= t.fromKwd && (t.throughKwd === null || basis <= t.throughKwd));
  if (program.tiers.length && !tier) return { ...unknown, note: `الحد أو شريحة كسور الإنفاق بين الحدود المنشورة غير واضحة؛ يلزم تأكيد البنك ولم نقدر استردادًا. ${program.conditionsAr}` };
  const monthly = Math.min(program.monthlyCapKwd, program.rules.reduce((sum, rule) => {
    const reward = (answers.cashbackSpending?.[rule.category] ?? 0) * (tier?.ratePercent ?? rule.ratePercent) / 100;
    return sum + Math.min(rule.monthlyCapKwd ?? Infinity, reward);
  }, 0));
  const earned = roundKwd(roundKwd(monthly) * 12);
  if (program.minimumRedemptionKwd === null) return { estimated: true, deductible: false, annualKwd: earned, note: `عائد مكتسب مشروط مقدر ${earned} د.ك سنويًا؛ حد الاستبدال غير متوفر حاليًا، لذلك لم نخصمه من الرسوم ولم نعتبر الحد صفرًا. ${program.conditionsAr}` };
  if (earned < program.minimumRedemptionKwd) return { estimated: true, deductible: true, annualKwd: 0, note: `النقاط المقدرة خلال سنة لا تبلغ حد الاستبدال ${program.minimumRedemptionKwd} د.ك؛ لم تخصم من التكلفة.` };
  return {
    estimated: true, deductible: true, annualKwd: earned,
    note: `تقدير للعائد المكتسب المشروط على الفئات المدخلة فقط، مع ثبات الإنفاق 12 شهرًا وتطبيق الشرائح والسقوف. تصنيف التاجر والاستبدال والتقريب النهائي يحددها البنك. ${program.conditionsAr}`,
  };
}
