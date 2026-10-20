import type { IncomingMessage, ServerResponse } from "node:http";
import type { Express } from "express";
import { logger } from "./lib/logger";

// One initialization per warm function, shared by concurrent requests.
// There is no listener and no schema migration in a serverless request.
let initializing: Promise<Express> | undefined;

function readyApp(): Promise<Express> {
  if (!initializing) {
    initializing = Promise.all([
      import("./app"),
      import("./lib/bank-catalog"),
    ]).then(async ([{ default: app }, { seedBankCatalog }]) => {
      await seedBankCatalog();
      return app;
    }).catch((error) => {
      initializing = undefined;
      throw error;
    });
  }
  return initializing;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await readyApp();
    app(req, res);
  } catch (error) {
    // Do not expose database addresses, credentials, or SQL to the browser.
    logger.error({ errorName: error instanceof Error ? error.name : "UnknownError" }, "Bank Match initialization failed; check database connectivity and schema");
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({
      error: "الخدمة غير جاهزة حاليًا. تحقق من إعداد اتصال قاعدة البيانات وتجهيز جداولها.",
      code: "SERVICE_NOT_READY",
    }));
  }
}
