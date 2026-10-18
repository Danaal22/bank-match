import { db, banksTable, bankProductsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetBankProductResponse } from "@workspace/api-zod";
import type { CatalogProduct } from "./matching-engine";
export { rankProducts, rankingPolicy, matchingMethodology, validateAnswers } from "./matching-engine";
export type { Answers, RankedProducts } from "./matching-engine";

let cached: { expires: number; catalog: CatalogProduct[] } | undefined;
let loading: Promise<CatalogProduct[]> | undefined;

export async function loadCatalog(): Promise<CatalogProduct[]> {
  if (cached && cached.expires > Date.now()) return cached.catalog;
  if (loading) return loading;
  loading = readCatalog().then((catalog) => {
    cached = { catalog, expires: Date.now() + 30_000 };
    return catalog;
  });
  try { return await loading; } finally { loading = undefined; }
}

async function readCatalog(): Promise<CatalogProduct[]> {
  const rows = await db
    .select({ product: bankProductsTable, bank: banksTable })
    .from(bankProductsTable)
    .innerJoin(banksTable, eq(bankProductsTable.bankId, banksTable.id));
  return rows.map(({ product: p, bank }) => ({
    product: GetBankProductResponse.parse({
      ...p, bankNameAr: bank.nameAr, bankNameEn: bank.nameEn,
      bankWebsite: bank.website, bankInitials: bank.initials,
    }),
    tags: p.matchingTags,
  }));
}
