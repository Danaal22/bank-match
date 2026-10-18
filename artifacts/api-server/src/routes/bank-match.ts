import { Router, type IRouter } from "express";
import {
  GetBankProductParams,
  GetBankProductResponse,
  GetBankRecommendationsBody,
  GetBankRecommendationsResponse,
  ListBankProductsResponse,
} from "@workspace/api-zod";
import { loadCatalog, rankProducts } from "../lib/bank-matching";
import { explainRecommendations } from "../lib/recommendation-explanation";

const router: IRouter = Router();

router.get("/products", async (_req, res): Promise<void> => {
  const catalog = await loadCatalog();
  res.json(ListBankProductsResponse.parse(catalog.map((item) => item.product)));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetBankProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "معرّف المنتج غير صالح" }); return; }
  const catalog = await loadCatalog();
  const item = catalog.find((entry) => entry.product.id === params.data.id);
  if (!item) { res.status(404).json({ error: "المنتج غير موجود" }); return; }
  res.json(GetBankProductResponse.parse(item.product));
});

router.post("/recommendations", async (req, res): Promise<void> => {
  const parsed = GetBankRecommendationsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "يرجى مراجعة إجابات الاختبار وإدخال قيم صحيحة." }); return; }
  const answers = parsed.data;
  if (
    answers.internationalMonthlySpendKwd > answers.monthlySpendKwd ||
    answers.monthlySpendKwd > 1_000_000 ||
    answers.priorities.length > 6
  ) {
    res.status(400).json({ error: "الإنفاق الدولي يجب ألا يتجاوز إجمالي الإنفاق الشهري، ويجب أن تكون القيم ضمن حدود معقولة." });
    return;
  }
  const recommendations = rankProducts(await loadCatalog(), answers);
  let explanationSource: "openrouter" | "rules" = "rules";
  try {
    explanationSource = await explainRecommendations(recommendations, answers, req.ip ?? "anonymous");
  } catch {
    req.log.warn("AI explanation unavailable; using the transparent rule-based explanation");
  }
  res.json(GetBankRecommendationsResponse.parse({
    recommendations,
    explanationSource,
    methodology: "نسبة التطابق مؤشر لترجيح التفضيلات وليست احتمال موافقة أو تقييم جودة مطلقًا. نرشّح فقط نوع البنك والمنتج المحددين، ثم نزن نمط الاستخدام وأولوياتك ومزايا السفر والرسوم السنوية الموثقة. لا نعامل الرسوم المجهولة كرسوم صفرية، ولا نرتب بالتكلفة الكلية إذا كانت ناقصة. عند عدم وجود ثلاثة منتجات موثقة ضمن تفضيلاتك نعرض عددًا أقل بدل إدراج خيارات مخالفة. لا نتحقق من دخلك أو جنسيتك أو سجلك الائتماني.",
  }));
});

export default router;
