import {
  date,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ProductSource = {
  title: string;
  url: string;
};

export type CashbackProgram = {
  minimumMonthlySpendKwd: number;
  minimumSpendBasis: "total" | "eligible";
  monthlyCapKwd: number;
  minimumRedemptionKwd: number;
  rules: { category: "groceries" | "dining" | "health" | "utilities" | "streaming" | "delivery" | "fuel" | "onlineFashion"; ratePercent: number; monthlyCapKwd: number | null }[];
  tiers: { fromKwd: number; throughKwd: number | null; ratePercent: number }[];
  conditionsAr: string;
};

export const banksTable = pgTable("banks", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  website: text("website").notNull(),
  initials: text("initials").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const bankProductsTable = pgTable(
  "bank_products",
  {
    id: text("id").primaryKey(),
    bankId: text("bank_id").notNull(),
    productNameAr: text("product_name_ar").notNull(),
    productNameEn: text("product_name_en").notNull(),
    productType: text("product_type").notNull(),
    category: text("category").notNull(),
    matchingTags: text("matching_tags").array().notNull().default([]),
    shariaStatus: text("sharia_status").notNull(),
    annualFeeKwd: numeric("annual_fee_kwd", { precision: 10, scale: 3, mode: "number" }),
    foreignTransactionFeePercent: numeric("foreign_transaction_fee_percent", {
      precision: 7,
      scale: 4,
      mode: "number",
    }),
    cashbackPercent: numeric("cashback_percent", {
      precision: 7,
      scale: 4,
      mode: "number",
    }),
    cashbackProgram: jsonb("cashback_program").$type<CashbackProgram>(),
    catalogRevision: integer("catalog_revision").notNull().default(0),
    minimumBalanceKwd: numeric("minimum_balance_kwd", {
      precision: 10,
      scale: 3,
      mode: "number",
    }),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    eligibility: text("eligibility").notNull(),
    feeNotes: text("fee_notes").notNull(),
    sources: jsonb("sources").$type<ProductSource[]>().notNull().default([]),
    lastVerified: date("last_verified", { mode: "string" }).notNull(),
  },
  (table) => ({
    bankReference: foreignKey({
      columns: [table.bankId],
      foreignColumns: [banksTable.id],
    }),
  }),
);

export const insertBankSchema = createInsertSchema(banksTable);
export const insertBankProductSchema = createInsertSchema(bankProductsTable);
export type Bank = typeof banksTable.$inferSelect;
export type BankProduct = typeof bankProductsTable.$inferSelect;
export type InsertBankProduct = z.infer<typeof insertBankProductSchema>;
