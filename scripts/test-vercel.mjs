import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";

// Run against the compiled function, not the development app. No AI calls.
const { default: handler } = await import("../api/index.mjs");
assert.equal(typeof handler, "function");
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const apiRoute = new RegExp(`^${config.routes[0].src}$`);
assert.ok(apiRoute.test("/api"));
assert.ok(apiRoute.test("/api/products/nbk-247"));
assert.ok(!apiRoute.test("/apiculture"));
assert.ok(!apiRoute.test("/products/nbk-247"));

const server = createServer(handler);
server.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const health = await fetch(`${base}/api/healthz`);
  if (process.argv.includes("--missing-database")) {
    assert.equal(health.status, 503);
    assert.deepEqual(await health.json(), {
      error: "الخدمة غير جاهزة حاليًا. تحقق من إعداد اتصال قاعدة البيانات وتجهيز جداولها.",
      code: "SERVICE_NOT_READY",
    });
    console.log("PASS: missing database returns a safe 503 without opening a listener or leaking configuration.");
  } else {
    assert.equal(health.status, 200);
    const products = await (await fetch(`${base}/api/products`)).json();
    assert.equal(products.length, 15);
    assert.equal(products.filter(p => p.review).length, 7);
    const detail = await fetch(`${base}/api/products/nbk-247`);
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).id, "nbk-247");
    const answers = {
      job: "employee", monthlySpendKwd: 600, internationalMonthlySpendKwd: 100,
      tripsPerYear: 6, monthlyPaidPrepaidReloads: 1, bankPreference: "conventional",
      productPreference: "card", priorities: ["low_fees", "travel"],
      primaryPriority: "low_fees", age: 25, monthlySalaryKwd: 250,
      nationality: "non_kuwaiti", repaymentMode: "full",
    };
    const recommend = async (path, body) => {
      const res = await fetch(`${base}/api/${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(res.status, 200);
      return res.json();
    };
    const lowFees = await recommend("recommendations", answers);
    assert.deepEqual(lowFees.recommendations.map(r => r.product.id), ["nbk-247", "burgan-prepaid", "cbk-signature"]);
    assert.deepEqual(lowFees.recommendations.map(r => r.annualCost.knownNetAnnualCostKwd), [61, 67, 110]);
    const travel = await recommend("recommendations", { ...answers, primaryPriority: "travel" });
    assert.equal(travel.recommendations[0].product.id, "burgan-world");
    const fallback = await recommend("recommendation-explanations", answers);
    assert.equal(fallback.explanationSource, "rules");
    assert.equal((await fetch(`${base}/api/not-a-route`)).status, 404);
    console.log("PASS: compiled Vercel entry serves health, 15 products, detail, validated JSON POST, both priority orders and no-key AI fallback.");
  }
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
