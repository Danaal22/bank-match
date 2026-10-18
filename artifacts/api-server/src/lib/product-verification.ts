import type { InsertBankProduct, ProductReview } from "@workspace/db";
import { reviewedCatalogChanges } from "./bank-catalog-enrichment";

const date = "2026-10-19";
const urls = {
  nbk: "https://nbk.com/kuwait/personal/cards/prepaid-cards/247-cashback.html",
  nbkTerms: "https://nbk.com/dam/jcr:00aaea9b-4d1a-4a84-9571-a65e6386b51a/terms-and-conditions-for-nbk-247-cashback-visa-platinum-prepaid-card.pdf",
  nbkTariff: "https://www.nbk.com/dam/jcr:cec64d2e-fb7f-4f46-911e-36f07ee4cede/nbk-bank-tariff-list-consumers-a.pdf",
  gulf: "https://www.e-gulfbank.com/en/personal/cards/credit-cards/visa-signature/",
  gulfFees: "https://www.e-gulfbank.com/en/personal/cards/know-more/fees-and-charges/cc-fees-and-charges",
  cbk: "https://www.cbk.com/Personal-Banking/Cards/Visa-Signature",
  cbkTariff: "https://www.cbk.com/media/357aa339-7736-456e-905c-8c51c3cdf516/jmpw-A/CBK%20Tariff%20-%20August%2026%20-%20WEB.pdf",
  boubyan: "https://www.bankboubyan.com/en/personal/cards/credit-cards/visa-signature",
  boubyanTariff: "https://www.bankboubyan.com/media/filer_public/4e/8b/4e8b2b7c-e3b5-47e3-b8fe-9be987583174/b_b_tarrif_list_eng_apr_26.pdf",
  pro: "https://bankboubyan.com/en/personal/accounts/pro",
  prepaid: "https://burgan.com/en/documents/313/CustomerProtectionBISCBMCPrepaidE.pdf",
  world: "https://burgan.com/en/documents/311/CustomerProtectionBISCBMCWorldE.pdf",
  burganTariff: "https://burgan.com/media/documents/T-13000-Tariff_List-August_2026-1080x1920-050826_DKC8Egj.pdf",
  brochure: "https://burgan.com/en/documents/342/BBCashbackCardeBrochuresE.pdf",
};
const fact = (field: string, value: string, sourceUrl: string) => ({ field, value, sourceUrl, verifiedAt: date });
const unknownRules: ProductReview["rules"] = { minAge: null, minSalaryKwd: null, maxSalaryKwd: null, nationality: "unknown" };
const balance = (url: string) => fact("الحد الأدنى للرصيد", "غير متوفر حاليًا في المصدر المراجع؛ ليس الحد الائتماني ولا رسومًا مفترضة.", url);
const unknownIdentity = "لم يحدد المصدر المراجع حد راتب أو جنسية واضحًا؛ لا يعني ذلك عدم وجود شروط أخرى.";
const cbkProgram = reviewedCatalogChanges.find(p => p.id === "cbk-signature")!.patch.cashbackProgram!;
const rows: { id: string; rules?: Partial<ProductReview["rules"]>; facts: ProductReview["facts"]; patch?: Partial<InsertBankProduct> }[] = [
  {
    id: "nbk-247", rules: { minAge: 15 },
    facts: [
      fact("نوع المنتج والأهلية", `مسبقة الدفع؛ العمر 15 سنة فأكثر. ${unknownIdentity}`, urls.nbk),
      fact("الرسوم السنوية", "10 د.ك تجديدًا.", urls.nbk),
      fact("رسوم المعاملات الأجنبية", "2.75% للبطاقات بالدينار، وتشمل معاملات الدينار خارج الكويت؛ صفحة 10.", urls.nbkTariff),
      fact("الاسترداد النقدي", "2% للجمعيات والصحة والوقود، 4% للفواتير، 7% للتوصيل و24% للبث، وفق MCC؛ إنفاق شهري 70 د.ك وسقف 247 د.ك وحد استبدال 10 د.ك.", urls.nbkTerms),
      balance(urls.nbk),
      fact("رسوم أخرى", "تعبئة 1.5 د.ك للعملية؛ صفحة 10.", urls.nbkTariff),
      fact("الإصدار والإعفاء", "إصدار 10 د.ك؛ إعفاؤه مرتبط بإنفاق 70 د.ك خلال 30 يومًا، لا نفترض تحققه من متوسط شهري.", urls.nbk),
    ],
  },
  {
    id: "gulf-signature", rules: { minSalaryKwd: 300 },
    facts: [
      fact("نوع المنتج والأهلية", "بطاقة ائتمانية شخصية، راتب 300 د.ك فأكثر. شرط شريحة Preferred ذات الاسم المشابه ليس شرط هذا المنتج. العمر والجنسية غير محددين بوضوح هنا.", urls.gulf),
      fact("الرسوم السنوية", "60 د.ك للبطاقة الأساسية؛ الإعفاءات الترويجية ليست مفترضة.", urls.gulfFees),
      fact("رسوم المعاملات الأجنبية", "3%، وتشمل معاملات الدينار خارج الكويت.", urls.gulfFees),
      fact("المكافآت", "نقطتان لكل دينار محلي و4 دوليًا؛ التحويل إلى نقد متاح، لكن قيمة نقدية موثقة كافية للحاسبة غير متوفرة.", urls.gulf),
      balance(urls.gulf),
      fact("رسوم أخرى", "دفع فوري عبر الفرع أو مركز الاتصال 0.5 د.ك للعملية؛ لا تدخل دون عدد استخدامات.", urls.gulfFees),
    ],
  },
  {
    id: "cbk-signature",
    patch: {
      cashbackProgram: {
        ...cbkProgram,
        rules: [...cbkProgram.rules, { category: "dining", ratePercent: 0, monthlyCapKwd: null }],
        conditionsAr: "شرائح 100–1000 بنسبة 1%، و1001–2000 بنسبة 3%، ومن 2001 بنسبة 5%، بسقف 500 د.ك شهريًا. نحسب الجمعيات والمطاعم والملابس الإلكترونية الموثقة صراحةً؛ فجوات الكسور تحتاج تأكيد البنك. تصنيف التاجر هو المرجع.",
      },
      features: ["استرداد 1% أو 3% أو 5% للفئات المؤهلة، بسقف 500 د.ك شهريًا وحد إنفاق 100 د.ك", "الجمعيات والمطاعم والملابس من الفئات المنشورة؛ تصنيف التاجر والاستحقاق يحددهما البنك", "قاعات المطارات بمعاملة دولية مؤهلة خلال 90 يومًا وتأمين سفر وفق الشروط"],
    },
    facts: [
      fact("نوع المنتج والأهلية", `بطاقة ائتمانية؛ حد ائتماني أدناه 750 د.ك، وليس راتبًا أو حد رصيد. ${unknownIdentity}`, urls.cbk),
      fact("الرسوم السنوية", "80 د.ك.", urls.cbk),
      fact("رسوم المعاملات الأجنبية", "2.5% وفق التعرفة.", urls.cbkTariff),
      fact("الاسترداد النقدي", "1% عند إنفاق 100–1000، و3% عند 1001–2000، و5% من 2001 د.ك؛ سقف 500 د.ك شهريًا، للفئات المؤهلة فقط. الفجوات الكسرية تحتاج تأكيدًا.", urls.cbk),
      balance(urls.cbk),
      fact("رسوم أخرى", "الإصدار 100 د.ك؛ APR المعلن 12% يتضمن رسم الخدمة. لا نقدّر التمويل دون بيانات الرصيد والسداد.", urls.cbk),
    ],
  },
  {
    id: "boubyan-signature",
    facts: [
      fact("نوع المنتج والأهلية", `بطاقة ائتمانية إسلامية. ${unknownIdentity} إعفاء السنة الأولى مرتبط بتحويل الراتب، لا الموافقة على البطاقة تلقائيًا.`, urls.boubyan),
      fact("الرسوم السنوية", "150 د.ك إصدار/تجديد الأساسية؛ بند 1/1.", urls.boubyanTariff),
      fact("رسوم المعاملات الأجنبية", "2.5% للاستخدام خارج الكويت بعملة أجنبية؛ بند 1/20، بخلاف تحويل الشبكة.", urls.boubyanTariff),
      fact("المكافآت", "اختيارات كاش باك ونقاط فنادق وأميال؛ لا نفترض قيمة تحويل غير موثقة في الحاسبة.", urls.boubyan),
      balance(urls.boubyan),
      fact("رسوم أخرى", "تمويل وسحب نقدي وخدمات إضافية بحسب الاستخدام والتعرفة، لا يشملها سيناريو المشتريات مع السداد الكامل.", urls.boubyanTariff),
    ],
  },
  {
    id: "burgan-prepaid",
    facts: [
      fact("نوع المنتج والأهلية", `مسبقة الدفع وليست بطاقة ائتمانية رغم وصف تسويقي عام في الصفحة. ${unknownIdentity}`, urls.prepaid),
      fact("الرسوم السنوية", "25 د.ك تجديدًا؛ إصدار 25 د.ك.", urls.prepaid),
      fact("رسوم المعاملات الأجنبية", "2.5% وفق التعرفة، بما فيها معاملات الدينار خارج الكويت.", urls.burganTariff),
      fact("الاسترداد النقدي", "5% على الفئات المؤهلة؛ السقف 75 د.ك شهريًا. الإفصاح يجمع بين حد 50 وعبارة أكثر من 50؛ لا نجزم عند 50 بالضبط.", urls.prepaid),
      balance(urls.prepaid),
      fact("رسوم أخرى", "تعبئة 1 د.ك إلا التحويل من حسابك لدى برقان؛ بدل فاقد/تالف 7.5 د.ك، وإعادة PIN بخمسة دنانير.", urls.prepaid),
      fact("الفئات والاستبدال", "مطاعم وصحة ومرافق واشتراكات، وملابس إلكترونية ضمن MCC؛ استبدال عبر Burgan Rewards، ولم يذكر الكتيب حد استبدال نقدي واضحًا.", urls.brochure),
    ],
    patch: {
      features: ["استرداد 5% على فئات مؤهلة بسقف 75 د.ك شهريًا؛ مبلغ إنفاق 50 بالضبط يحتاج تأكيدًا", "بطاقة مسبقة الدفع قابلة للتعبئة", "تأمين طبي للسفر وعروض سفر وفق شروط برنامج ماستركارد"],
      cashbackProgram: {
        minimumMonthlySpendKwd: 50, minimumSpendBasis: "eligible", monthlyCapKwd: 75, minimumRedemptionKwd: null,
        rules: (["dining", "health", "utilities", "streaming", "onlineFashion"] as const).map(category => ({ category, ratePercent: 5, monthlyCapKwd: null })),
        tiers: [{ fromKwd: 50.001, throughKwd: null, ratePercent: 5 }],
        conditionsAr: "5% على الفئات المؤهلة فقط بسقف 75 د.ك شهريًا. مبلغ 50 بالضبط غير محسوم بسبب عبارتي الحد الأدنى وأكثر من 50 في الإفصاح. الملابس والأحذية عبر الإنترنت فقط. التقدير للعائد المكتسب؛ الاستبدال يراجع مع البنك ولا نفترض حد استبدال غير منشور.",
      },
      feeNotes: "تجديد/إصدار 25 د.ك، واستخدام دولي 2.5% وفق التعرفة. تعبئة 1 د.ك إلا التحويل من حسابك لدى برقان. الإفصاح الأساسي يثبت سقف الكاش باك 75 د.ك شهريًا، و5% بفئات مؤهلة وإنفاق أعلى من 50؛ عند 50 بالضبط نطلب تأكيدًا. الحاسبة لسنة تجديد؛ تستبعد الإصدار والسحب والخدمات العرضية وفروق الشبكة.",
    },
  },
  {
    id: "burgan-world",
    patch: { cashbackProgram: { ...reviewedCatalogChanges.find(p => p.id === "burgan-world")!.patch.cashbackProgram!, minimumRedemptionKwd: null } },
    facts: [
      fact("نوع المنتج والأهلية", `ائتمانية؛ حد ائتماني 1000 د.ك فأكثر وليس راتبًا أو رصيدًا مطلوبًا. ${unknownIdentity}`, urls.world),
      fact("الرسوم السنوية", "150 د.ك.", urls.world),
      fact("رسوم المعاملات الأجنبية", "2.5% بالإضافة إلى سعر الصرف.", urls.world),
      fact("الاسترداد النقدي", "5% عند إنفاق مؤهل 100–1000 د.ك و15% إذا تجاوز 1000؛ سقف 500 د.ك شهريًا.", urls.world),
      fact("الاستبدال", "عبر Burgan Rewards؛ حد الاستبدال غير محدد بوضوح في الكتيب، فلا نعامله كصفر ولا نخصم عائدًا غير مؤكد الصرف.", urls.brochure),
      balance(urls.world),
      fact("رسوم أخرى", "إصدار/إضافية 150 د.ك، وسحب نقدي 4% أو 4 د.ك أيهما أعلى؛ السداد الدوار 8.33% وبحد أدنى 10 د.ك لا يساوي سدادًا كاملًا.", urls.world),
    ],
  },
  {
    id: "boubyan-pro", rules: { minSalaryKwd: 400, maxSalaryKwd: 1499, nationality: "kuwaiti" },
    facts: [
      fact("نوع المنتج والأهلية", "حساب/شريحة Pro للموظفين الكويتيين براتب 400–1499 د.ك؛ ليست بطاقة ائتمانية بذاتها. هدية تحويل الراتب مشروطة.", urls.pro),
      fact("الرسوم السنوية", "غير متوفرة حاليًا كرسوم شاملة للحساب في المصدر المراجع؛ مجانية بطاقة السنة الأولى ليست إعفاءً شاملًا للحساب.", urls.pro),
      fact("رسوم المعاملات الأجنبية", "رسوم البطاقة المرتبطة غير متحققة لهذا الحساب؛ لا نفترض صفرًا.", urls.pro),
      fact("المكافآت", "هدايا ومزايا مشروطة؛ لا تخصم كدخل سنوي مضمون.", urls.pro),
      balance(urls.pro),
      fact("رسوم أخرى", "خزائن الأمان اختيارية برسوم منفصلة؛ لا نضيفها تلقائيًا لاستخدام الحساب.", urls.pro),
    ],
  },
];

export const productVerificationUpdates = rows.map(({ id, rules, facts, patch }) => ({
  id,
  patch: {
    ...patch,
    review: { rules: { ...unknownRules, ...rules }, facts },
    sources: [...new Set(facts.map(f => f.sourceUrl))].map(url => ({ title: facts.find(f => f.sourceUrl === url)!.field + " — المصدر الرسمي", url })),
    eligibility: facts[0]!.value,
  } satisfies Partial<InsertBankProduct>,
}));
