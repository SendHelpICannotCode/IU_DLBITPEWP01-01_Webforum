"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * Holt grundlegende Forum-Statistiken für Admin-Dashboard
 * Nur für Administratoren zugänglich
 */
export async function getAdminStats() {
  const session = await getSession();

  // Nur Admins dürfen Statistiken sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      userCount: 0,
      categoryCount: 0,
      lockedThreadCount: 0,
    };
  }

  // Parallel alle Counts holen für bessere Performance
  const [userCount, categoryCount, lockedThreadCount] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.thread.count({
      where: { isLocked: true },
    }),
  ]);

  return {
    userCount,
    categoryCount,
    lockedThreadCount,
  };
}
