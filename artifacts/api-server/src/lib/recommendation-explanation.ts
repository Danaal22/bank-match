import type { Answers, RankedProducts } from "./bank-matching";
import { createHash } from "node:crypto";

const usage = new Map<string, number>();
type Texts = Map<string, string>;
const cache = new Map<string, { expires: number; texts: Texts }>();
const pending = new Map<string, Promise<Texts | null>>();

export async function explainRecommendations(
  recommendations: RankedProducts,
  answers: Answers,
  clientKey: string,
): Promise<"openrouter" | "rules"> {
  if (!process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || !process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || !recommendations.length) return "rules";
  const key = createHash("sha256").update(JSON.stringify({ answers, recommendations })).digest("hex");
  const now = Date.now();
  const apply = (texts: Texts | null): "openrouter" | "rules" => {
    if (!texts || !recommendations.every((r) => texts.has(r.product.id))) return "rules";
    for (const r of recommendations) r.recommendationText = texts.get(r.product.id)!;
    return "openrouter";
  };
  const cached = cache.get(key);
  if (cached && cached.expires > now) return apply(cached.texts);
  if (pending.has(key)) return apply(await pending.get(key)!);
  // Keep the cost-producing enhancement bounded without blocking the core matcher.
  if ((usage.get(clientKey) ?? 0) > now - 60_000) return "rules";
  if (pending.size >= 4) return "rules";
  if (usage.size >= 1000) usage.delete(usage.keys().next().value!);
  usage.set(clientKey, now);
  const generation = generateTexts(recommendations, answers);
  pending.set(key, generation);
  try {
    const texts = await generation;
    if (texts) {
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: now + 30 * 60_000, texts });
    }
    return apply(texts);
  } finally { pending.delete(key); }
}

async function generateTexts(recommendations: RankedProducts, answers: Answers): Promise<Texts | null> {
  const { openrouter } = await import("@workspace/integrations-openrouter-ai");
  const completion = await openrouter.chat.completions.create({
    model: "qwen/qwen3.6-flash",
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "أنت محرر عربي موجز لتوصيات Bank Match. استخدم الأسباب المعطاة فقط دون إضافة أرقام أو رسوم أو مزايا أو وعود أهلية. لا تغير الترتيب أو النسب. جملتان غير مكررتين بحد أقصى 240 حرفًا لكل منتج، مع تنبيه الرسوم الناقصة إن وجدت. أرجع JSON فقط: explanations مصفوفة {id,text}.",
      },
      {
        role: "user",
        content: JSON.stringify({
          profile: answers,
          products: recommendations.map((r) => ({
            id: r.product.id,
            name: r.product.productNameAr,
            bank: r.product.bankNameAr,
            reasons: r.reasons,
            missing: r.annualCost.missing,
          })),
        }),
      },
    ],
  }, { timeout: 20_000, maxRetries: 0 });
  const text = completion.choices[0]?.message?.content?.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  if (!text) throw new Error("Empty explanation");
  const parsed: unknown = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  if (typeof parsed !== "object" || parsed === null || !("explanations" in parsed) || !Array.isArray(parsed.explanations)) throw new Error("Invalid explanation response");
  const explanations = new Map<string, string>();
  for (const item of parsed.explanations) {
    if (typeof item !== "object" || item === null || typeof item.id !== "string" || typeof item.text !== "string" || !item.text.trim() || item.text.length > 280) continue;
    const sentences = item.text.trim().split(/(?<=[.؟!])\s+/);
    if (sentences.length > 3 || new Set(sentences).size !== sentences.length) continue;
    if (recommendations.some((r) => r.product.id === item.id)) explanations.set(item.id, item.text.trim());
  }
  return explanations.size === recommendations.length ? explanations : null;
}
