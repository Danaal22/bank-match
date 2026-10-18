import type { Answers, CatalogProduct } from "./matching-engine";

export function evaluateEligibility(p: CatalogProduct["product"], a: Answers) {
  const rules = p.review?.rules;
  if (!rules) return { status: "needs_confirmation" as const, summary: "شروط الأهلية غير متحققة تفصيليًا؛ يلزم تأكيد البنك.", notes: [p.eligibility] };
  const failures: string[] = [], missing: string[] = [], met: string[] = [];
  const check = (value: number | undefined, limit: number | null, label: string, maximum = false) => {
    if (limit === null) return;
    if (value === undefined) missing.push(`لم تدخل ${label} للتحقق من شرط ${limit}.`);
    else if (maximum ? value > limit : value < limit) failures.push(`${label} لا يحقق الشرط المنشور ${maximum ? "حتى" : "من"} ${limit}.`);
    else met.push(`${label} يتفق مع الشرط المنشور.`);
  };
  check(a.age, rules.minAge, "العمر");
  check(a.monthlySalaryKwd, rules.minSalaryKwd, "الراتب الشهري");
  check(a.monthlySalaryKwd, rules.maxSalaryKwd, "الراتب الشهري", true);
  if (rules.nationality === "kuwaiti") {
    if (!a.nationality || a.nationality === "unknown") missing.push("الجنسية غير مدخلة، والمنتج للكويتيين وفق المصدر.");
    else if (a.nationality !== "kuwaiti") failures.push("الجنسية لا تتفق مع شرط المنتج للكويتيين.");
    else met.push("الجنسية تتفق مع الشرط المنشور.");
  }
  const status = failures.length ? "not_met" : missing.length || !met.length ? "needs_confirmation" : "published_conditions_match";
  const unpublished = [rules.minAge === null ? "العمر" : "", rules.minSalaryKwd === null ? "حد الراتب" : "", rules.nationality === "unknown" ? "الجنسية" : ""].filter(Boolean);
  return {
    status,
    summary: status === "not_met" ? "لا يطابق شرط أهلية منشورًا." : status === "published_conditions_match"
      ? "شروط منشورة محددة متوافقة؛ لا يعني موافقة البنك." : "يلزم استكمال أو تأكيد شروط الأهلية مع البنك.",
    notes: [...new Set([...failures, ...missing, ...met, ...(unpublished.length ? [`قيود ${unpublished.join("، ")} غير متاحة بوضوح في المصدر المراجع؛ أكدها مع البنك.`] : []), "الضمانات وتقييم الائتمان وشروط أخرى لم نفترضها؛ القرار للبنك."])],
  };
}
