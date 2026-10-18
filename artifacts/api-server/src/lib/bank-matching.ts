import { db, banksTable, bankProductsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetBankProductResponse } from "@workspace/api-zod";
import type { CatalogProduct } from "./matching-engine";
export { rankProducts, rankingPolicy, matchingMethodology, validateAnswers } from "./matching-engine";
export type { Answers, RankedProducts } from "./matching-engine";

export async function loadCatalog(): Promise<CatalogProduct[]> {
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
