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
      threadCount: 0,
      postCount: 0,
      categoryCount: 0,
      lockedThreadCount: 0,
      bannedUserCount: 0,
    };
  }

  // Parallel alle Counts holen für bessere Performance
  const [
    userCount,
    threadCount,
    postCount,
    categoryCount,
    lockedThreadCount,
    bannedUserCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.thread.count(),
    prisma.post.count(),
    prisma.category.count(),
    prisma.thread.count({
      where: { isLocked: true },
    }),
    prisma.user.count({
      where: {
        isBanned: true,
        isDeleted: false, // Nur gesperrte, nicht gelöschte Nutzer
      },
    }),
  ]);

  return {
    userCount,
    threadCount,
    postCount,
    categoryCount,
    lockedThreadCount,
    bannedUserCount,
  };
}

/**
 * Holt erweiterte Forum-Statistiken für Admin-Dashboard
 * Nur für Administratoren zugänglich
 */
export async function getForumStats() {
  const session = await getSession();

  // Nur Admins dürfen Statistiken sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return null;
  }

  // Parallel alle Statistiken holen
  const [
    totalThreads,
    totalPosts,
    totalUsers,
    bannedUsers,
    lockedThreadCount,
    topUsers,
    recentThreads,
    recentPosts,
    categoryDistribution,
  ] = await Promise.all([
    prisma.thread.count(),
    prisma.post.count(),
    prisma.user.count(),
    prisma.user.count({
      where: {
        isBanned: true,
        isDeleted: false, // Nur gesperrte, nicht gelöschte Nutzer
      },
    }),
    prisma.thread.count({ where: { isLocked: true } }),
    prisma.user.findMany({
      take: 50, // Hole mehr, um dann nach Thread-Count zu sortieren
      select: {
        id: true,
        username: true,
        _count: {
          select: {
            threads: true,
            posts: true,
          },
        },
      },
    }),
    prisma.thread.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        isLocked: true,
        author: {
          select: {
            username: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      include: {
        threads: {
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  // Sortiere Top-Users nach Thread-Count (Client-seitig, da Prisma orderBy mit _count nicht direkt unterstützt)
  const topUsersSorted = topUsers
    .sort((a, b) => {
      const totalA = a._count.threads + a._count.posts;
      const totalB = b._count.threads + b._count.posts;
      return totalB - totalA;
    })
    .slice(0, 10);

  // Berechne Kategorien-Verteilung
  const categoryDistributionFormatted = categoryDistribution.map((cat) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    threadCount: cat.threads.length,
  }));

  return {
    totalThreads,
    totalPosts,
    totalUsers,
    bannedUsers,
    lockedThreadCount,
    topUsers: topUsersSorted,
    recentThreads,
    recentPosts,
    categoryDistribution: categoryDistributionFormatted,
  };
}
