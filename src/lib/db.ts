import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { cache } from "react";
import { unstable_noStore } from "next/cache";

/**
 * Prisma Client Singleton
 * Verhindert mehrere Instanzen im Development-Modus (Hot Reload)
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL ist nicht definiert");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Prüft, ob die Datenbankverbindung funktioniert.
 * - unstable_noStore(): Verhindert Caching über Requests hinweg
 * - cache(): Dedupliziert Aufrufe innerhalb eines Requests
 */
export const checkDatabaseConnection = cache(async (): Promise<boolean> => {
  // Kein Caching über Requests hinweg - DB-Status muss immer aktuell sein
  unstable_noStore();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
});
