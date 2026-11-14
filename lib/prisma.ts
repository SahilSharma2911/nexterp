import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const cs = process.env.DATABASE_URL ?? "";
  // Keep nexterp's tables in their own schema when one is given in the URL
  // (e.g. ?schema=nexterp) so it can share a database with another app.
  const schemaMatch = cs.match(/[?&]schema=([^&]+)/);
  const schema = schemaMatch ? decodeURIComponent(schemaMatch[1]) : undefined;
  // Local Postgres needs no SSL; hosted providers (Supabase/Neon) do.
  const isLocal = /@(localhost|127\.0\.0\.1)/.test(cs);
  // Hand pg a clean base URL — it doesn't understand ?schema and mishandles
  // ?sslmode alongside an explicit ssl option. Strip the query string, but
  // only the one after the host (the password may itself contain a "?").
  const at = cs.lastIndexOf("@");
  const qIdx = at >= 0 ? cs.indexOf("?", at) : cs.indexOf("?");
  const base = qIdx >= 0 ? cs.slice(0, qIdx) : cs;

  const pool = new Pool({
    connectionString: base,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool, schema ? { schema } : undefined);
  return new PrismaClient({
    adapter,
    // Hosted Postgres adds network latency; give multi-step document
    // transactions (and the seed) room beyond the 5s default.
    transactionOptions: { maxWait: 15_000, timeout: 60_000 },
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
