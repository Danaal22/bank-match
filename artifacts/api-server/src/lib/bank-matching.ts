import { db, banksTable, bankProductsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetBankProductResponse,
  GetBankRecommendationsBody,
} from "@workspace/api-zod";

export type Answers = ReturnType<typeof GetBankRecommendationsBody.parse>;
type Product = ReturnType<typeof GetBankProductResponse.parse>;
type CatalogProduct = { product: Product; tags: string[] };
const round = (amount: number) => Math.round((amount + Number.EPSILON) * 1000) / 1000;

export async function loadCatalog(): Promise<CatalogProduct[]> {
  const rows = await db
    .select({ product: bankProductsTable, bank: banksTable })
    .from(bankProductsTable)
    .innerJoin(banksTable, eq(bankProductsTable.bankId, banksTable.id));
  return rows.map(({ product: p, bank }) => ({
    product: GetBankProductResponse.parse({
      ...p,
      bankNameAr: bank.nameAr,
      bankNameEn: bank.nameEn,
      bankWebsite: bank.website,
      bankInitials: bank.initials,
    }),
    tags: p.matchingTags,
  }));
}

export function annualCost(item: CatalogProduct, answers: Answers) {
  const { product: p, tags } = item;
  const missing: string[] = [];
  if (p.annualFeeKwd === null) missing.push("الرسم السنوي المتكرر غير متاح أو غير مؤكد");
  const annualFee = p.annualFeeKwd ?? 0;
  let foreignFees = 0;
  if (p.productType === "card" && answers.internationalMonthlySpendKwd > 0) {
    if (p.foreignTransactionFeePercent === null) {
      missing.push("رسم معاملات العملات الأجنبية غير متاح كقيمة قابلة للتطبيق على إنفاقك");
    } else {
      foreignFees = answers.internationalMonthlySpendKwd * 12 * p.foreignTransactionFeePercent / 100;
    }
  }
  if (tags.includes("cashback")) missing.push("الكاش باك مشروط بفئات وحدود إنفاق لم يحددها الاختبار، لذلك لم يُخصم");
  if (p.productType === "account") missing.push("رسوم الخدمات أو البطاقة المرتبطة بالحساب تعتمد على الاستخدام وغير مشمولة");
  return {
    knownAnnualFeesKwd: annualFee,
    knownAnnualForeignFeesKwd: round(foreignFees),
    knownAnnualCashbackKwd: 0,
    knownNetAnnualCostKwd: round(annualFee + foreignFees),
    complete: missing.length === 0,
    missing,
    calculationNote: `التقدير = الرسم السنوي الموثق + (${answers.internationalMonthlySpendKwd} د.ك إنفاق دولي شهري × 12 × رسم العملات الموثق). القيم غير المتاحة مستبعدة وليست صفرًا. لم نخصم كاش باك مشروطًا. نفترض السداد الكامل دون تمويل أو سحب نقدي، ولا نحتسب رسوم الإصدار أو فروق سعر تحويل الشبكة أو الخدمات الاختيارية. الإيداع الأولي والحد الأدنى للرصيد ليسا رسومًا.`,
  };
}

function scoreProduct(item: CatalogProduct, answers: Answers) {
  const { product: p, tags } = item;
  let points = 0;
  let maximum = 0;
  const reasons: string[] = [];
  const add = (weight: number, ratio: number, reason?: string) => {
    maximum += weight;
    points += weight * ratio;
    if (ratio > 0 && reason) reasons.push(reason);
  };
  if (answers.bankPreference !== "any") {
    add(30, p.shariaStatus === answers.bankPreference ? 1 : 0,
      p.shariaStatus === "islamic" ? "من بنك إسلامي، بما يتفق مع تفضيلك." : "من بنك تقليدي، بما يتفق مع تفضيلك.");
  }
  if (answers.productPreference !== "any") {
    add(20, p.productType === answers.productPreference ? 1 : 0, "نوع المنتج يطابق اختيارك في الاختبار.");
  }
  if (answers.job === "student") {
    const prepaid = tags.includes("prepaid");
    add(15, prepaid ? 1 : p.productType === "account" ? 0.6 : 0.2,
      prepaid ? "كونها مسبقة الدفع يساعد على تحديد ميزانية دون افتراض أهلية ائتمانية." : "تحقق من شروط العمر والدخل قبل التقديم؛ الاختبار لا يؤكد الأهلية.");
  } else if (answers.job === "employee") {
    add(15, tags.includes("salary") ? 1 : tags.includes("daily") ? 0.9 : 0.6,
      tags.includes("salary") ? "حساب مخصص للراتب؛ يلزم التحقق من الجنسية وشريحة الراتب." : "يمكن دراسة هذا المنتج ضمن إدارة المصاريف اليومية.");
  } else {
    add(15, tags.includes("travel") ? 1 : 0, tags.includes("travel") ? "توجد ميزة سفر موثقة لهذا المنتج." : undefined);
  }
  for (const priority of [...new Set(answers.priorities)]) {
    if (priority === "low_fees") {
      add(20, p.annualFeeKwd !== null && p.annualFeeKwd <= 25 ? 1 : 0,
        p.annualFeeKwd !== null && p.annualFeeKwd <= 25 ? `رسمه السنوي الموثق ${p.annualFeeKwd} د.ك؛ يلائم أولوية الرسوم السنوية المنخفضة، دون تأكيد انخفاض التكلفة الكلية.` : undefined);
    } else {
      const matches = priority === "account" || priority === "card"
        ? p.productType === priority
        : priority === "sharia"
          ? p.shariaStatus === "islamic"
          : tags.includes(priority);
      const labels: Record<string, string> = {
        cashback: "لديه برنامج كاش باك أو مكافآت قابلة للاستبدال، لكن الاستحقاق والمبلغ يخضعان للشروط.",
        travel: "مزايا السفر الموثقة تتفق مع إحدى أولوياتك.",
        sharia: "بنك إسلامي بما يتفق مع أولوية التعامل المتوافق مع الشريعة.",
        account: "حساب بنكي يتفق مع نوع المنتج الذي تبحث عنه.",
        card: "بطاقة بنكية تتفق مع نوع المنتج الذي تبحث عنه.",
      };
      add(20, matches ? 1 : 0, matches ? labels[priority] : undefined);
    }
  }
  if (answers.tripsPerYear > 0) {
    add(answers.tripsPerYear >= 3 ? 20 : 10, tags.includes("travel") ? 1 : 0,
      tags.includes("travel") ? "وتيرة سفرك تجعل مزايا السفر جديرة بالمقارنة مع رسومها." : undefined);
  }
  if (answers.monthlySpendKwd <= 300) {
    add(10, p.annualFeeKwd !== null && p.annualFeeKwd <= 25 ? 1 : 0);
  } else {
    add(10, tags.includes("cashback") ? 1 : 0.3);
  }
  return {
    matchPercent: Math.max(0, Math.min(100, Math.round(points / Math.max(maximum, 1) * 100))),
    reasons: reasons.slice(0, 4),
  };
}

export function rankProducts(catalog: CatalogProduct[], answers: Answers) {
  return catalog
    .filter(({ product: p, tags }) =>
      (answers.bankPreference === "any" || p.shariaStatus === answers.bankPreference) &&
      (answers.productPreference === "any" || p.productType === answers.productPreference) &&
      !(answers.job === "student" && tags.includes("salary")))
    .map((item) => {
      const score = scoreProduct(item, answers);
      const reasons = score.reasons.length ? score.reasons : ["هذا خيار من القائمة المتاحة للمقارنة؛ لم تتوفر مزايا موثقة كافية تطابق أولوياتك."];
      return {
        product: item.product,
        ...score,
        reasons,
        annualCost: annualCost(item, answers),
        recommendationText: reasons.join(" ") + " هذه مطابقة تفضيلات وليست موافقة بنكية أو ضمان أهلية.",
      };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent || a.product.id.localeCompare(b.product.id))
    .slice(0, 3);
}

export type RankedProducts = ReturnType<typeof rankProducts>;
