import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep connection multiplication bounded across serverless instances.
  max: process.env.VERCEL ? 3 : 10,
  connectionTimeoutMillis: 8000,
  allowExitOnIdle: Boolean(process.env.VERCEL),
});
pool.on("error", (error) => {
  // pg removes the failed idle client; prevent an unhandled event from
  // terminating the process. Never log a connection string.
  console.error("Unexpected idle PostgreSQL connection error", { name: error.name });
});
export const db = drizzle(pool, { schema });

export * from "./schema";
