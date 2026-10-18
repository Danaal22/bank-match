import type { InsertBankProduct, CashbackProgram } from "@workspace/db";

const rule = (category: CashbackProgram["rules"][number]["category"], ratePercent = 0, monthlyCapKwd: number | null = null) => ({ category, ratePercent, monthlyCapKwd });
const nbkTerms = "https://www.nbk.com/ar/dam/jcr:00aaea9b-4d1a-4a84-9571-a65e6386b51a/terms-and-conditions-for-nbk-247-cashback-visa-platinum-prepaid-card.pdf";
const tariff = "https://www.kfh.com/en/dam/jcr:facb4a64-c65f-47d7-affc-f5e019acfda4/KFH_Tariff_List_Poster_En_10-08-2026.pdf";

// Reviewed against official product pages and disclosures on 2026-10-18.
// This revision updates only reviewed fields, once; subsequent user edits survive restarts.
export const reviewedCatalogChanges: { id: string; patch: Partial<InsertBankProduct> }[] = [
  {
    id: "nbk-247",
    patch: {
      cashbackProgram: {
        minimumMonthlySpendKwd: 70, minimumSpendBasis: "total", monthlyCapKwd: 247, minimumRedemptionKwd: 10,
        rules: [rule("streaming", 24), rule("delivery", 7, 15), rule("utilities", 4), rule("health", 2), rule("groceries", 2), rule("fuel", 2, 5)],
        tiers: [],
        conditionsAr: "حد أدنى 70 د.ك مشتريات مؤهلة شهريًا؛ سقف إجمالي 247 د.ك شهريًا. التوصيل عبر تطبيقات الطعام فقط بسقف 15 د.ك، والوقود بسقف 5 د.ك. البث بالدفع المباشر للمزود. الاستبدال من 10 د.ك، ويخضع رمز التاجر للأهلية. لا نجمع مكافآت المحفظة الرقمية مع هذه الفئات.",
      },
      feeNotes: "الإصدار 10 د.ك والتجديد السنوي 10 د.ك؛ قد يعفى الإصدار عند استيفاء شرط 70 د.ك خلال أول 30 يومًا. لا نفترض الإعفاء. الاسترداد المقدر مقصور على الفئات المدخلة ورموز التجار المؤهلة، والرسوم الأجنبية غير متوفر حاليًا.",
      sources: [
        { title: "صفحة بطاقة 247 الرسمية", url: "https://www.nbk.com/ar/kuwait/personal/cards/prepaid-cards/247-cashback.html" },
        { title: "شروط نسب الاسترداد والفئات والحدود الرسمية", url: nbkTerms },
      ],
    },
  },
  {
    id: "burgan-world",
    patch: {
      cashbackProgram: {
        minimumMonthlySpendKwd: 100, minimumSpendBasis: "eligible", monthlyCapKwd: 500, minimumRedemptionKwd: 0,
        rules: [rule("dining"), rule("health"), rule("utilities"), rule("streaming"), rule("onlineFashion")],
        tiers: [{ fromKwd: 100, throughKwd: 1000, ratePercent: 5 }, { fromKwd: 1000.001, throughKwd: null, ratePercent: 15 }],
        conditionsAr: "5% على الإنفاق الشهري المؤهل حتى 1,000 د.ك و15% إذا تجاوزه؛ الحد الأدنى المؤهل 100 د.ك والسقف 500 د.ك شهريًا. المطاعم والمقاهي والصحة والمرافق والاشتراكات مؤهلة، والملابس والأحذية مؤهلة عبر الإنترنت فقط. نجري التقدير على الفئات المدخلة فقط.",
      },
      features: ["استرداد 5% أو 15% حسب الإنفاق المؤهل، بحد أدنى 100 د.ك وسقف 500 د.ك شهريًا", "الفئات المؤهلة تشمل المطاعم والصحة والمرافق والاشتراكات، وبعض التسوق عبر الإنترنت وفق إفصاح البنك", "12 زيارة سنوية لقاعات المطارات وتأمين سفر وفق الشروط"],
    },
  },
  {
    id: "cbk-signature",
    patch: {
      cashbackProgram: {
        minimumMonthlySpendKwd: 100, minimumSpendBasis: "total", monthlyCapKwd: 500, minimumRedemptionKwd: 0,
        rules: [rule("groceries"), rule("onlineFashion")],
        tiers: [{ fromKwd: 100, throughKwd: 1000, ratePercent: 1 }, { fromKwd: 1001, throughKwd: 2000, ratePercent: 3 }, { fromKwd: 2001, throughKwd: null, ratePercent: 5 }],
        conditionsAr: "شرائح الإنفاق المنشورة: 100–1,000 د.ك بنسبة 1%؛ 1,001–2,000 بنسبة 3%؛ ومن 2,001 بنسبة 5%، بسقف شهري 500 د.ك. نحسب فقط الجمعيات والملابس والأحذية الإلكترونية المذكورة صراحةً؛ الفئات الأخرى وشريحة الكسور بين الحدود تحتاج تأكيد البنك.",
      },
      features: ["استرداد 1% أو 3% أو 5% حسب شريحة الإنفاق، بحد أدنى 100 د.ك وسقف 500 د.ك شهريًا", "الجمعيات والملابس والأحذية من الفئات المذكورة صراحةً؛ نطاق الفئات الإضافية يحتاج تأكيد البنك", "قاعات المطارات تتطلب معاملة دولية مؤهلة خلال 90 يومًا، مع تأمين سفر وفق الشروط"],
    },
  },
  {
    id: "kfh-signature",
    patch: {
      foreignTransactionFeePercent: 2.5,
      features: ["نقاط قابلة للاستبدال باسترداد: أساس 1.5% وزيادات حسب شرائح الإنفاق المحلي والدولي، وفق الشروط", "الحد الأدنى لاستبدال النقاط 20 د.ك والسقف السنوي للاسترداد 1,500 د.ك", "قاعات المطارات مشروطة بمعاملة دولية بقيمة دولار كل ثلاثة أشهر؛ وتأمين سفر عند دفع السفر بالبطاقة"],
      feeNotes: "الرسم السنوي غير مؤكد: صفحة المنتج 150 د.ك مقابل 155 د.ك في التعرفة؛ لم نرجّح مصدرًا دون تأكيد. رسم الاستخدام الدولي للبطاقة الائتمانية 2.5% وفق التعرفة، دون فروق تحويل الشبكة. لا نقدر النقاط نقدًا لوجود قواعد التجار والاستبدال والحدود.",
      sources: [
        { title: "الرسوم وشرائح النقاط وشروط الاستبدال الرسمية", url: "https://www.kfh.com/en/home/Personal/Cards/credit-cards/Visa-Signature.html" },
        { title: "تعرفة بيت التمويل الكويتي 2026", url: tariff },
      ],
    },
  },
  {
    id: "gulf-signature",
    patch: {
      features: ["12 زيارة سنوية لقاعات المطارات وفق البرنامج ومعاملة دولية بدولار خلال 90 يومًا", "تأمين سفر عند شراء التذاكر بالبطاقة وفق شروط التغطية", "نقاط مكافآت: نقطتان لكل دينار محلي و4 نقاط دوليًا؛ لا نفترض قيمة نقدية للنقطة"],
      eligibility: "راتب 300 د.ك أو أكثر وفق صفحة المنتج، مع خضوع الموافقة لتقييم البنك. المصروفات المدخلة ليست إثباتًا للراتب.",
      sources: [
        { title: "رسوم وعمولات بطاقات بنك الخليج", url: "https://www.e-gulfbank.com/en/personal/cards/know-more/fees-and-charges/cc-fees-and-charges" },
        { title: "مزايا السفر والأهلية الرسمية", url: "https://www.e-gulfbank.com/en/personal/cards/credit-cards/visa-signature" },
      ],
    },
  },
  {
    id: "boubyan-signature",
    patch: {
      feeNotes: "إعفاء السنة الأولى مشروط بتحويل الراتب، وتطبق الرسوم المعتادة بعده. رسم التجديد ونسبة رسوم العملات وقيمة تحويل المكافآت نقدًا غير متوفر حاليًا؛ لا نفترض الإعفاء أو صفر رسوم.",
    },
  },
];
