import type { InsertBankProduct } from "@workspace/db";

// Verified 2026-10-19. Numeric values are fixed tariff amounts, not marketing maxima.
// Each source is linked on the corresponding public product page.
const nbk = "https://www.nbk.com/dam/jcr:cec64d2e-fb7f-4f46-911e-36f07ee4cede/nbk-bank-tariff-list-consumers-a.pdf";
const cbk = "https://www.cbk.com/media/357aa339-7736-456e-905c-8c51c3cdf516/jmpw-A/CBK%20Tariff%20-%20August%2026%20-%20WEB.pdf";
const boubyan = "https://www.bankboubyan.com/media/filer_public/4e/8b/4e8b2b7c-e3b5-47e3-b8fe-9be987583174/b_b_tarrif_list_eng_apr_26.pdf";
const burgan = "https://burgan.com/media/documents/T-13000-Tariff_List-August_2026-1080x1920-050826_DKC8Egj.pdf";
const brochure = "https://burgan.com/en/documents/317/Cashback_Brochure_EN_Jun_2026.pdf";
const source = (title: string, url: string) => ({ title, url });

export const verifiedFeeUpdates: { id: string; patch: Partial<InsertBankProduct> }[] = [
  {
    id: "nbk-foreign-prepaid",
    patch: {
      matchingTags: ["travel", "prepaid", "currency"],
      feeNotes: "التجديد 10 د.ك. التعرفة الحالية تذكر 2.75% عند تعبئة بطاقة العملة الأجنبية من حساب بالدينار، والشروط تذكرها عند اختلاف عملة الشراء عن البطاقة أو الشراء بالدينار. لا نحول هذه الشروط إلى رسم عام ثابت دون معرفة عملة البطاقة والشراء وطريقة التمويل؛ حتى الاستخدام المحلي قد يسبب تحويل عملة. تكلفة شاملة غير قابلة للحساب بالإجابات الحالية.",
      sources: [
        source("صفحة البطاقة الرسمية", "https://www.nbk.com/kuwait/personal/cards/prepaid-cards/Foreign-Currency-Prepaid-Card.html"),
        source("تعرفة الأفراد الحالية — صفحة 10", nbk),
        source("شروط بطاقات العملات والتعبئة", "https://www.nbk.com/dam/jcr:a8ae97d6-67aa-466b-bb0d-2b6d53b5fd0f/TermsAndConditionsNBKPrepaidCards.pdf"),
      ],
    },
  },
  {
    id: "kfh-foreign-prepaid",
    patch: {
      matchingTags: ["travel", "prepaid", "sharia", "currency"],
      feeNotes: "التعرفة تذكر إصدارًا/تجديدًا 10 د.ك و2.5% عند اختلاف عملة العملية عن عملة البطاقة. لا نطبقها على كامل الإنفاق دون معرفة العملتين، ولا نفترض أن المشتريات المحلية بالدينار بلا تحويل إذا كانت البطاقة بعملة أجنبية. تكلفة شاملة غير قابلة للحساب بالإجابات الحالية.",
      sources: [source("تعرفة بيت التمويل: التجديد وشروط عملة البطاقة", "https://www.kfh.com/en/dam/jcr:facb4a64-c65f-47d7-affc-f5e019acfda4/KFH_Tariff_List_Poster_En_10-08-2026.pdf")],
    },
  },
  {
    id: "cbk-current",
    patch: {
      eligibility: "إيداع فتح الحساب الجاري بالدينار للأفراد 100 د.ك وفق الصفحة الرسمية، وليس رسومًا أو حدًا أدنى مستمرًا مفترضًا.",
      feeNotes: "الرسوم السنوية والحد الأدنى المستمر للأفراد غير متوفر حاليًا في البيانات المتحققة. صفحة المنتج تذكر عمولة 2 د.ك عند هبوط المتوسط عن 100 د.ك في قسم حساب الشركات؛ لا نطبقها على حساب الأفراد. رسوم الشيكات والخدمات تعتمد على الاستخدام.",
      sources: [source("الجاري: الفصل بين حسابات الأفراد والشركات", "https://www.cbk.com/Personal-Banking/Accounts/Current-Account")],
    },
  },
  {
    id: "kfh-saving",
    patch: {
      feeNotes: "صفحة الحساب تؤكد عدم وجود رسوم فتح؛ لم نعتبر ذلك إعفاءً من كل الرسوم السنوية أو خدمات البطاقة. الحد الأدنى المستمر والرسوم الدورية الشاملة غير متوفر حاليًا في البيانات المتحققة، ولا نقدر عائد المضاربة.",
      sources: [source("حساب التوفير: رسوم الفتح والأهلية الرسمية", "https://www.kfh.com/en/home/Personal/Accounts/saving-account.html")],
    },
  },
  {
    id: "nbk-247",
    patch: {
      foreignTransactionFeePercent: 2.75, prepaidReloadFeeKwd: 1.5,
      feeNotes: "التجديد 10 د.ك؛ الإصدار 10 د.ك وقد يعفى بشرط إنفاق 70 د.ك خلال 30 يومًا، ولا نفترض الإعفاء. تعرفة الأفراد الحالية، صفحة 10: 2.75% على العمليات الدولية للبطاقات المقومة بالدينار، بما فيها عمليات الدينار خارج الكويت، و1.500 د.ك لكل إعادة تعبئة. الحاسبة تضيف رسوم عدد التعبئات المدفوعة المدخل، ولا تشمل الإصدار أو فروق تحويل الشبكة.",
      sources: [
        source("صفحة بطاقة 247 الرسمية", "https://www.nbk.com/ar/kuwait/personal/cards/prepaid-cards/247-cashback.html"),
        source("شروط الكاش باك والفئات والسقوف", "https://www.nbk.com/ar/dam/jcr:00aaea9b-4d1a-4a84-9571-a65e6386b51a/terms-and-conditions-for-nbk-247-cashback-visa-platinum-prepaid-card.pdf"),
        source("تعرفة الأفراد الحالية: رسوم العملات وإعادة التعبئة، صفحة 10", nbk),
      ],
    },
  },
  {
    id: "cbk-signature",
    patch: {
      foreignTransactionFeePercent: 2.5,
      feeNotes: "تعرفة أغسطس 2026 تؤكد تجديدًا سنويًا 80 د.ك وإصدار السنة الأولى 100 د.ك، ورسم مشتريات دولية 2.50% إضافة إلى التحويل. الحاسبة للرسوم السنوية المتكررة دون الإصدار والسحب أو التمويل. نطاق بعض فئات الكاش باك وحدود الكسور يحتاج تأكيدًا؛ لا نوسع الفئات المفترضة.",
      sources: [
        source("مزايا وشروط سيغنتشر الرسمية", "https://www.cbk.com/Personal-Banking/Cards/Visa-Signature"),
        source("تعرفة التجاري الرسمية — أغسطس 2026", cbk),
      ],
    },
  },
  {
    id: "boubyan-signature",
    patch: {
      annualFeeKwd: 150, foreignTransactionFeePercent: 2.5,
      feeNotes: "التعرفة المنشورة حاليًا عبر صفحة الرسوم الرسمية، أبريل 2026، البند 1/1: إصدار/تجديد سيغنتشر الأساسية 150 د.ك، والبند 1/20: استخدام الائتمانية خارج الكويت بعملة أجنبية 2.5% بالإضافة إلى تحويل الشبكة. لا نفترض إعفاء السنة الأولى المشروط بتحويل الراتب. لا نفترض قيمة نقدية للمكافآت، ونقدّر هنا الرسوم المتكررة دون التمويل أو السحب النقدي.",
      sources: [
        source("مزايا سيغنتشر وشروط إعفاء السنة الأولى", "https://www.bankboubyan.com/en/personal/cards/credit-cards/visa-signature"),
        source("صفحة الرسوم التي تربط بالتعرفة الحالية", "https://bankboubyan.com/en/fees-and-commissions"),
        source("تعرفة بوبيان الرسمية — أبريل 2026", boubyan),
      ],
    },
  },
  {
    id: "burgan-prepaid",
    patch: {
      foreignTransactionFeePercent: 2.5, prepaidReloadFeeKwd: 1, cashbackPercent: 5,
      features: ["استرداد 5% على فئات يومية مؤهلة مع إنفاق مؤهل 50 د.ك شهريًا على الأقل", "بطاقة مسبقة الدفع قابلة للتعبئة", "تأمين طبي للسفر وعروض سفر وفق شروط برنامج ماستركارد"],
      feeNotes: "التعرفة، أغسطس 2026: الإصدار/التجديد 25 د.ك، والمعاملات الأجنبية 2.5% بما فيها معاملات الدينار خارج الكويت. إعادة التعبئة 1 د.ك، مع إعفاء التعبئة الإلكترونية من حسابك لدى برقان؛ أدخل عدد التعبئات الخاضعة للرسوم، ويمكن وضع صفر إذا كانت جميعها معفاة. كاش باك 5% بفئات محددة وحد أدنى مؤهل 50 د.ك؛ سقف الاسترداد غير متوفر حاليًا، لذلك لا نخصم عائدًا نقديًا مقدرًا. لا تشمل الحاسبة السحب والتمويل والإصدار.",
      sources: [
        source("صفحة البطاقة الرسمية", "https://burgan.com/en/cards/prepaid-card-details/2"),
        source("تعرفة برقان الرسمية — أغسطس 2026، البنود 1.1 و1.6 و1.7", burgan),
        source("كتيب الكاش باك — يونيو 2026 والفئات المؤهلة", brochure),
      ],
    },
  },
  {
    id: "burgan-saving",
    patch: {
      feeNotes: "الرسم السنوي والحد الأدنى المستمر غير متوفر حاليًا في البيانات المتحققة. تعرفة أغسطس 2026 تذكر إغلاق حساب خلال ثلاثة أشهر 5 د.ك وإعادة تنشيط حساب راكد بالفرع 5 د.ك (الإلكتروني مجاني). رسوم الحد الأدنى 2 د.ك شهريًا مقيدة بحسابات الجوائز والسحب أو غير الأفراد؛ لا نعممها على هذا الحساب. لا نقدّر عائد الفائدة أو رسوم خدمات لم يحدد استخدامها.",
      sources: [
        source("حساب التوفير: الأهلية والإيداع الافتتاحي", "https://burgan.com/en/personal/accounts/saving-account/"),
        source("تعرفة برقان الرسمية — أغسطس 2026، قسم الحسابات", burgan),
      ],
    },
  },
];
