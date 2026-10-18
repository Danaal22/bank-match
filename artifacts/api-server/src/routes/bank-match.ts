import { Router, type IRouter } from "express";
import {
  GetBankProductParams,
  GetBankProductResponse,
  GetBankRecommendationsBody,
  GetBankRecommendationsResponse,
  ListBankProductsResponse,
} from "@workspace/api-zod";
import { loadCatalog, rankProducts, rankingPolicy, matchingMethodology, validateAnswers } from "../lib/bank-matching";
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
  const error = validateAnswers(answers);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const recommendations = rankProducts(await loadCatalog(), answers);
  res.json(GetBankRecommendationsResponse.parse({
    recommendations, explanationSource: "rules", matchingVersion: "2",
    rankingPolicy: rankingPolicy(answers), methodology: matchingMethodology,
  }));
});

// Optional, user-triggered enhancement: never lies on the core results path.
router.post("/recommendation-explanations", async (req, res): Promise<void> => {
  const parsed = GetBankRecommendationsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "يرجى مراجعة إجابات الاختبار." }); return; }
  const answers = parsed.data;
  const error = validateAnswers(answers);
  if (error) { res.status(400).json({ error }); return; }
  const recommendations = rankProducts(await loadCatalog(), answers);
  let explanationSource: "openrouter" | "rules" = "rules";
  try {
    explanationSource = await explainRecommendations(recommendations, answers, req.ip ?? "anonymous");
  } catch {
    req.log.warn("AI explanation unavailable; using the transparent rule-based explanation");
  }
  res.json(GetBankRecommendationsResponse.parse({
    recommendations, explanationSource, matchingVersion: "2",
    rankingPolicy: rankingPolicy(answers), methodology: matchingMethodology,
  }));
});

export default router;
