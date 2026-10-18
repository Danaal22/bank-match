import type { Answers, RankedProducts } from "./bank-matching";

const usage = new Map<string, number>();

export async function explainRecommendations(
  recommendations: RankedProducts,
  answers: Answers,
  clientKey: string,
): Promise<"openrouter" | "rules"> {
  if (!process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || !process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || !recommendations.length) return "rules";
  const now = Date.now();
  // Keep the cost-producing enhancement bounded without blocking the core matcher.
  if ((usage.get(clientKey) ?? 0) > now - 60_000) return "rules";
  if (usage.size > 1000) {
    for (const [key, time] of usage) if (time < now - 60_000) usage.delete(key);
  }
  usage.set(clientKey, now);
  const { openrouter } = await import("@workspace/integrations-openrouter-ai");
  const completion = await openrouter.chat.completions.create({
    model: "qwen/qwen3.6-flash",
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "أنت محرر شرح توصيات Bank Match في الكويت. اكتب بالعربية البسيطة فقط. لا تخترع رسومًا أو مزايا ولا تغير الترتيب أو النسب أو الأرقام. استخدم فقط الأسباب المعطاة. لا تعطِ وعود أهلية أو نصيحة استثمارية. وضّح نقص بيانات التكلفة عند وجوده. أرجع JSON فقط به حقل explanations وهو مصفوفة عناصر {id,text}، النص جملتان أو ثلاث لكل منتج.",
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
    if (typeof item !== "object" || item === null || typeof item.id !== "string" || typeof item.text !== "string" || item.text.length > 1500) continue;
    if (recommendations.some((r) => r.product.id === item.id)) explanations.set(item.id, item.text);
  }
  if (explanations.size !== recommendations.length) return "rules";
  for (const target of recommendations) target.recommendationText = explanations.get(target.product.id)!;
  return "openrouter";
}
