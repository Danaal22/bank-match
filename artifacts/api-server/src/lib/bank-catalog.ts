import { db, banksTable, bankProductsTable } from "@workspace/db";
import { and, eq, lt } from "drizzle-orm";
import { reviewedCatalogChanges } from "./bank-catalog-enrichment";

const verified = "2026-10-18";
const banks = [
  { id: "nbk", nameAr: "بنك الكويت الوطني", nameEn: "National Bank of Kuwait", website: "https://www.nbk.com/kuwait/", initials: "NBK" },
  { id: "kfh", nameAr: "بيت التمويل الكويتي", nameEn: "Kuwait Finance House", website: "https://www.kfh.com/", initials: "KFH" },
  { id: "boubyan", nameAr: "بنك بوبيان", nameEn: "Boubyan Bank", website: "https://www.bankboubyan.com/", initials: "BB" },
  { id: "gulf", nameAr: "بنك الخليج", nameEn: "Gulf Bank", website: "https://www.e-gulfbank.com/", initials: "GB" },
  { id: "cbk", nameAr: "البنك التجاري الكويتي", nameEn: "Commercial Bank of Kuwait", website: "https://www.cbk.com/", initials: "CBK" },
  { id: "burgan", nameAr: "بنك برقان", nameEn: "Burgan Bank", website: "https://burgan.com/", initials: "BBK" },
];

type CatalogEntry = typeof bankProductsTable.$inferInsert;
const common = {
  annualFeeKwd: null,
  foreignTransactionFeePercent: null,
  cashbackPercent: null,
  minimumBalanceKwd: null,
  eligibility: "تخضع الأهلية والموافقة لشروط البنك. تفاصيل الدخل والضمانات غير متاحة حاليًا في قاعدة بياناتنا؛ تحقّق من البنك مباشرة.",
  feeNotes: "المعلومة غير المتاحة لا تعني أن الخدمة مجانية. لا تشمل التقديرات فوائد أو تكاليف تمويل أو سحب نقدي أو تأخر سداد أو رسوم إصدار لمرة واحدة.",
  lastVerified: verified,
};
const source = (url: string, title = "صفحة المنتج الرسمية") => [{ title, url }];

const products: CatalogEntry[] = [
  {
    ...common, id: "nbk-247", bankId: "nbk", productNameAr: "بطاقة 247 كاش باك مسبقة الدفع", productNameEn: "247 Cashback Prepaid Card",
    productType: "card", category: "مسبقة الدفع", shariaStatus: "conventional", annualFeeKwd: 10,
    matchingTags: ["cashback", "travel", "prepaid"],
    features: ["كاش باك مشروط بالفئة: حتى 24% على اشتراكات البث، و7% على توصيل الطلبات، و4% على الفواتير، وفق الشروط والحدود", "6 زيارات سنوية إلى 25 قاعة انتظار عبر Visa Airport Companion وفق شروط البرنامج", "بطاقة افتراضية مع إمكانية طلب بطاقة بلاستيكية"],
    eligibility: "العمر 15 سنة فأكثر وفق صفحة المنتج. يخضع الإصدار للشروط والأحكام.",
    feeNotes: "رسوم الإصدار 10 د.ك والرسوم السنوية 10 د.ك. نسب الكاش باك متعددة ومشروطة؛ لم نفترض استحقاق الحد الأقصى ولم نخصمها من التكلفة.",
    sources: source("https://www.nbk.com/ar/kuwait/personal/cards/prepaid-cards/247-cashback.html"),
  },
  {
    ...common, id: "nbk-foreign-prepaid", bankId: "nbk", productNameAr: "بطاقة العملات الأجنبية مسبقة الدفع", productNameEn: "Foreign Currency Prepaid Card",
    productType: "card", category: "مسبقة الدفع", shariaStatus: "conventional", annualFeeKwd: 10,
    matchingTags: ["travel", "prepaid"],
    features: ["متاحة بعملات أجنبية متعددة", "تتيح الاحتفاظ برصيد بعملة البطاقة لتخطيط مصاريف السفر", "رسوم الإصدار 10 د.ك"],
    feeNotes: "التجديد السنوي 10 د.ك. لا نفترض أن رسوم الصرف صفر؛ تتغير المعاملة حسب عملة البطاقة وعملة الشراء وتفاصيل التعرفة.",
    sources: source("https://www.nbk.com/kuwait/personal/cards/prepaid-cards/Foreign-Currency-Prepaid-Card.html"),
  },
  {
    ...common, id: "nbk-current", bankId: "nbk", productNameAr: "الحساب الجاري", productNameEn: "Current Account",
    productType: "account", category: "حساب جارٍ", shariaStatus: "conventional", minimumBalanceKwd: 0,
    matchingTags: ["account", "daily"],
    features: ["حساب غير مدر للفائدة لإدارة المعاملات اليومية", "بطاقة سحب Visa وخدمات مصرفية إلكترونية", "لا يوجد حد أدنى مستمر للرصيد وفق صفحة المنتج"],
    eligibility: "العمر 21 سنة فأكثر. مبلغ فتح الحساب 500 د.ك أو أكثر، وهو ليس رسومًا ولا حدًا أدنى مستمرًا.",
    sources: source("https://nbk.com/kuwait/personal/accounts/everyday-banking/current-account.html"),
  },
  {
    ...common, id: "kfh-signature", bankId: "kfh", productNameAr: "بطاقة فيزا سيغنتشر", productNameEn: "Visa Signature Card",
    productType: "card", category: "بطاقة ائتمانية", shariaStatus: "islamic",
    matchingTags: ["cashback", "travel", "sharia"],
    features: ["مكافآت قابلة للاستبدال بكاش باك وفق شرائح الإنفاق والاستثناءات", "دخول قاعات المطارات مشروط بمعاملة دولية مؤهلة وفق برنامج Visa", "تأمين سفر متعدد الرحلات وفق شروط التغطية"],
    feeNotes: "تعارض مصدران رسميان: صفحة المنتج تعرض 150 د.ك سنويًا، وتعرفة 2026 تعرض 155 د.ك لبطاقة Visa Signature دون أقساط؛ لذلك تركنا الرسم غير مؤكد حتى يوضحه البنك. لا نخصم الكاش باك المشروط.",
    sources: [...source("https://www.kfh.com/en/home/Personal/Cards/credit-cards/Visa-Signature.html"), ...source("https://www.kfh.com/en/dam/jcr:facb4a64-c65f-47d7-affc-f5e019acfda4/KFH_Tariff_List_Poster_En_10-08-2026.pdf", "تعرفة بيت التمويل الكويتي 2026")],
  },
  {
    ...common, id: "kfh-foreign-prepaid", bankId: "kfh", productNameAr: "بطاقة مسبقة الدفع للعملات الأجنبية", productNameEn: "Foreign Currency Prepaid Card",
    productType: "card", category: "مسبقة الدفع", shariaStatus: "islamic", annualFeeKwd: 10,
    matchingTags: ["travel", "prepaid", "sharia"],
    features: ["بطاقة مسبقة الدفع بعملة أجنبية", "رسم إصدار أو تجديد منشور قدره 10 د.ك"],
    feeNotes: "تذكر التعرفة 2.5% للسحب أو نقاط البيع بعملة مختلفة عن عملة البطاقة. لا نطبقها على كامل إنفاق السفر دون معرفة عملة البطاقة والشراء؛ لذا رسم العملات العام غير متاح في الحاسبة.",
    sources: source("https://www.kfh.com/en/dam/jcr:facb4a64-c65f-47d7-affc-f5e019acfda4/KFH_Tariff_List_Poster_En_10-08-2026.pdf", "تعرفة بيت التمويل الكويتي 2026"),
  },
  {
    ...common, id: "kfh-saving", bankId: "kfh", productNameAr: "حساب التوفير الاستثماري", productNameEn: "Investment Saving Account",
    productType: "account", category: "حساب ادخار", shariaStatus: "islamic",
    matchingTags: ["account", "sharia", "saving"],
    features: ["استثمار الرصيد وفق مبدأ المضاربة وأحكام الشريعة", "إدارة الحساب عبر KFH Online", "لا توجد رسوم لفتح الحساب وفق صفحة المنتج؛ هذا لا يعني انعدام جميع الرسوم"],
    sources: source("https://www.kfh.com/en/home/Personal/Accounts/saving-account.html"),
  },
  {
    ...common, id: "boubyan-signature", bankId: "boubyan", productNameAr: "بطاقة فيزا سيغنتشر", productNameEn: "Visa Signature",
    productType: "card", category: "بطاقة ائتمانية", shariaStatus: "islamic",
    matchingTags: ["cashback", "travel", "sharia"],
    features: ["مكافآت بوبيان مع خيارات كاش باك وأميال ونقاط فنادق وفق الشروط", "دخول قاعات المطارات وفق شروط برنامج Visa", "تأمين سفر وحماية مشتريات وفق التغطية"],
    feeNotes: "تذكر الصفحة إعفاء السنة الأولى عند تحويل الراتب، ثم الرسوم المعتادة. قيمة التجديد غير متاحة حاليًا؛ لا نفترض انطباق الإعفاء أو قيمة المكافآت.",
    sources: source("https://www.bankboubyan.com/en/personal/cards/credit-cards/visa-signature"),
  },
  {
    ...common, id: "boubyan-pro", bankId: "boubyan", productNameAr: "حساب بوبيان برو", productNameEn: "Pro Salary Account",
    productType: "account", category: "حساب راتب", shariaStatus: "islamic",
    matchingTags: ["account", "salary", "sharia"],
    features: ["حساب موجه للموظفين الكويتيين", "عروض وخصومات وشروط مكافآت تحويل الراتب حسب البنك", "دعم مصرفي وخدمات رقمية"],
    eligibility: "وفق صفحة المنتج: للموظفين الكويتيين براتب بين 400 و1,499 د.ك. الاختبار يسأل عن المصروفات لا الراتب، لذلك لا يؤكد أهليتك لهذا الحساب.",
    sources: source("https://bankboubyan.com/en/personal/accounts/pro"),
  },
  {
    ...common, id: "gulf-signature", bankId: "gulf", productNameAr: "بطاقة فيزا سيغنتشر", productNameEn: "Visa Signature",
    productType: "card", category: "بطاقة ائتمانية", shariaStatus: "conventional", annualFeeKwd: 60, foreignTransactionFeePercent: 3,
    matchingTags: ["card", "travel"],
    features: ["بطاقة ضمن فئة Visa Signature", "اشتراك سنوي منشور 60 د.ك", "تعرفة منشورة لمعاملات العملات الأجنبية"],
    feeNotes: "رسم العملات 3% يشمل أيضًا معاملات الدينار المنفذة خارج الكويت وفق التعرفة. الحاسبة تستخدم فقط مبلغ الإنفاق الدولي الذي أدخلته؛ لا تشمل سعر تحويل الشبكة أو الاقتراض والسحب النقدي.",
    sources: source("https://www.e-gulfbank.com/en/personal/cards/know-more/fees-and-charges/cc-fees-and-charges", "رسوم وعمولات بطاقات بنك الخليج"),
  },
  {
    ...common, id: "gulf-current", bankId: "gulf", productNameAr: "الحساب الجاري", productNameEn: "Current Account",
    productType: "account", category: "حساب جارٍ", shariaStatus: "conventional",
    matchingTags: ["account", "daily"],
    features: ["حساب غير مدر للفائدة", "متاح بالدينار واليورو والدولار والجنيه الإسترليني", "لا يوجد حد لعدد عمليات السحب وفق صفحة المنتج"],
    eligibility: "مبلغ الإيداع عند الفتح 200 د.ك وفق صفحة المنتج؛ لم نعتبره رسومًا أو حدًا أدنى مستمرًا.",
    feeNotes: "دفتر الشيكات برسوم تختلف حسب العدد. الرسوم الدورية والحد الأدنى المستمر غير متاحين حاليًا في قاعدة البيانات.",
    sources: source("https://www.e-gulfbank.com/en/personal/accounts/current-accounts/"),
  },
  {
    ...common, id: "cbk-signature", bankId: "cbk", productNameAr: "بطاقة التجاري فيزا سيغنتشر", productNameEn: "Al-Tijari Visa Signature",
    productType: "card", category: "بطاقة ائتمانية", shariaStatus: "conventional", annualFeeKwd: 80,
    matchingTags: ["cashback", "travel"],
    features: ["كاش باك 1% أو 3% أو 5% حسب شريحة الإنفاق على فئات مؤهلة، بحد شهري 500 د.ك", "الحد الأدنى الشهري المؤهل للكاش باك 100 د.ك", "دخول قاعات المطارات مشروط بمعاملة دولية مؤهلة خلال 90 يومًا"],
    eligibility: "الحد الأدنى للحد الائتماني 750 د.ك. تخضع الموافقة وشروط الدخل لتقييم البنك.",
    feeNotes: "الرسم السنوي 80 د.ك ورسوم الإصدار 100 د.ك، وهي منفصلة وغير مضافة للتكلفة السنوية المتكررة. لا نفترض أن جميع مصروفاتك ضمن فئات الكاش باك.",
    sources: source("https://www.cbk.com/Personal-Banking/Cards/Visa-Signature"),
  },
  {
    ...common, id: "cbk-current", bankId: "cbk", productNameAr: "الحساب الجاري بالدينار الكويتي", productNameEn: "KD Current Account",
    productType: "account", category: "حساب جارٍ", shariaStatus: "conventional",
    matchingTags: ["account", "daily"],
    features: ["حساب غير مدر للفائدة", "لإدارة الأنشطة والمعاملات المالية عبر البنك"],
    sources: source("https://www.cbk.com/Personal-Banking/Accounts/Current-Account"),
  },
  {
    ...common, id: "burgan-world", bankId: "burgan", productNameAr: "بطاقة ماستركارد وورلد كاش باك", productNameEn: "Cashback Mastercard World Credit Card",
    productType: "card", category: "بطاقة ائتمانية", shariaStatus: "conventional", annualFeeKwd: 150, foreignTransactionFeePercent: 2.5,
    matchingTags: ["cashback", "travel"],
    features: ["كاش باك 5% أو 15% على إنفاق مؤهل وفق الشريحة وبحد أقصى 500 د.ك شهريًا", "حد أدنى للإنفاق المؤهل 100 د.ك شهريًا", "12 زيارة سنوية لقاعات المطارات وتأمين سفر وفق الشروط"],
    eligibility: "حد ائتماني 1,000 د.ك أو أكثر وفق إفصاح المعلومات الأساسية. تخضع الموافقة لتقييم البنك.",
    feeNotes: "الرسم السنوي 150 د.ك، والاستخدام الدولي 2.5% بالإضافة إلى سعر الصرف. الإفصاح يذكر رسم إصدار 150 د.ك منفصلًا؛ لا تشمل الحاسبة رسوم الإصدار أو التمويل. الكاش باك مقصور على فئات محددة ولا يُخصم تلقائيًا.",
    sources: source("https://burgan.com/en/documents/311/CustomerProtectionBISCBMCWorldE.pdf", "إفصاح المعلومات الأساسية الرسمي"),
  },
  {
    ...common, id: "burgan-saving", bankId: "burgan", productNameAr: "حساب التوفير", productNameEn: "Savings Account",
    productType: "account", category: "حساب توفير", shariaStatus: "conventional",
    matchingTags: ["account", "saving"],
    features: ["حساب توفير للأفراد بالدينار الكويتي", "تحتسب الفائدة على أدنى رصيد شهري وتدفع كل ثلاثة أشهر", "لا يوجد حد أدنى لاكتساب الفائدة؛ لا نفترض أن ذلك يلغي شروط الرصيد أو رسوم الخدمات"],
    eligibility: "للأفراد فقط. إيداع فتح الحساب 100 د.ك، وليس رسومًا أو دليلًا على الحد الأدنى المستمر. لا يقبل تحويل الراتب وفق صفحة المنتج.",
    feeNotes: "الرسم السنوي ورسوم المعاملات الأجنبية والكاش باك والحد الأدنى المستمر للرصيد غير متوفر حاليًا في البيانات المتحققة. لا نقدّر عائد الفائدة أو نفترض انعدام رسوم الخدمات.",
    lastVerified: "2026-10-19",
    sources: source("https://burgan.com/en/personal/accounts/saving-account/", "حساب التوفير: المزايا والأهلية والأسئلة الرسمية"),
  },
  {
    ...common, id: "burgan-prepaid", bankId: "burgan", productNameAr: "بطاقة ماستركارد كاش باك مسبقة الدفع", productNameEn: "Cashback Mastercard Prepaid",
    productType: "card", category: "مسبقة الدفع", shariaStatus: "conventional", annualFeeKwd: 25,
    matchingTags: ["cashback", "prepaid"],
    features: ["بطاقة مسبقة الدفع قابلة لإعادة التعبئة", "برنامج كاش باك على فئات مؤهلة وفق شروط البنك"],
    feeNotes: "جدول شروط البطاقات مسبقة الدفع يذكر رسمًا سنويًا وتجديدًا 25 د.ك لهذه البطاقة. رسوم إعادة التعبئة والعمليات الأخرى لا تدخل في التقدير لعدم معرفة عددها.",
    sources: [...source("https://burgan.com/en/cards/prepaid-card-details/2"), ...source("https://burgan.com/en/documents/156/TC-_Prepaid_Card.pdf", "شروط البطاقات مسبقة الدفع الرسمية")],
  },
];

export async function seedBankCatalog(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(banksTable).values(banks).onConflictDoNothing();
    await tx.insert(bankProductsTable).values(products).onConflictDoNothing();
    for (const { id, patch } of reviewedCatalogChanges) {
      await tx.update(bankProductsTable)
        .set({ ...patch, lastVerified: verified, catalogRevision: 1 })
        .where(and(eq(bankProductsTable.id, id), lt(bankProductsTable.catalogRevision, 1)));
    }
  });
}
