"use server";

import { prisma, checkDatabaseConnection } from "@/lib/db";
import { getSession } from "@/lib/session";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Action Result Type für einheitliche Fehlerbehandlung
 */
export type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Prüft, ob der aktuelle Benutzer ein Admin ist
 */
async function requireAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      isAdmin: false,
      error: "Nur Administratoren können diese Aktion durchführen",
    };
  }

  return { isAdmin: true };
}

/**
 * Holt alle Benutzer mit Pagination und optionalen Filtern
 */
export async function getAllUsers(
  page: number = 1,
  pageSize: number = 15,
  filters?: {
    search?: string;
    status?: "active" | "banned";
    role?: UserRole;
  }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return {
      users: [],
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
      error: adminCheck.error,
    };
  }

  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    return {
      users: [],
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
      error: "Datenbankverbindung fehlgeschlagen",
    };
  }

  const validPage = Math.max(1, page);
  const validPageSize = [10, 15, 20, 50].includes(pageSize) ? pageSize : 15;
  const skip = (validPage - 1) * validPageSize;

  // Filter aufbauen
  const whereClause: {
    OR?: Array<{
      username?: { contains: string; mode: "insensitive" };
      email?: { contains: string; mode: "insensitive" };
    }>;
    isBanned?: boolean;
    role?: UserRole;
  } = {};

  // Such-Filter (Username oder E-Mail)
  if (filters?.search && filters.search.trim().length >= 2) {
    const searchTerm = filters.search.trim();
    whereClause.OR = [
      {
        username: {
          contains: searchTerm,
          mode: "insensitive" as const,
        },
      },
      {
        email: {
          contains: searchTerm,
          mode: "insensitive" as const,
        },
      },
    ];
  }

  // Status-Filter
  if (filters?.status === "banned") {
    whereClause.isBanned = true;
  } else if (filters?.status === "active") {
    whereClause.isBanned = false;
  }

  // Rolle-Filter
  if (filters?.role) {
    whereClause.role = filters.role;
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      skip,
      take: validPageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        bannedUntil: true,
        banReason: true,
        bannedBy: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            threads: true,
            posts: true,
          },
        },
      },
    }),
    prisma.user.count({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));

  return {
    users,
    totalCount,
    page: validPage,
    pageSize: validPageSize,
    totalPages,
  };
}

/**
 * Holt einen einzelnen Benutzer mit vollständigen Daten
 */
export async function getUser(userId: string) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return { user: null, error: adminCheck.error };
  }

  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    return { user: null, error: "Datenbankverbindung fehlgeschlagen" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      preferences: true,
      isBanned: true,
      bannedUntil: true,
      banReason: true,
      bannedBy: true,
      createdAt: true,
      lastActiveAt: true,
      _count: {
        select: {
          threads: true,
          posts: true,
        },
      },
    },
  });

  return { user };
}

/**
 * Holt den Aktivitätsverlauf eines Benutzers
 */
export async function getUserActivity(userId: string) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return {
      threads: [],
      posts: [],
      error: adminCheck.error,
    };
  }

  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    return {
      threads: [],
      posts: [],
      error: "Datenbankverbindung fehlgeschlagen",
    };
  }

  const [threads, posts] = await Promise.all([
    prisma.thread.findMany({
      where: { authorId: userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.post.findMany({
      where: { authorId: userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  ]);

  return { threads, posts };
}

/**
 * Ändert die Rolle eines Benutzers
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }

  // Verhindere, dass der letzte Admin seine Rolle ändert
  if (role === "USER") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (adminCount === 1 && targetUser?.role === "ADMIN") {
      return {
        success: false,
        error:
          "Der letzte Administrator kann nicht zu einem normalen Benutzer gemacht werden",
      };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/forum/admin/users");
    revalidatePath("/forum/admin");

    return { success: true };
  } catch (error) {
    console.error("Rollen-Update-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Sperrt einen Benutzer
 */
export async function banUser(
  userId: string,
  reason?: string,
  until?: Date
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }

  const session = await getSession();

  // Verhindere, dass Admins sich selbst sperren
  if (session.userId === userId) {
    return {
      success: false,
      error: "Du kannst dich nicht selbst sperren",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedUntil: until || null,
        banReason: reason || null,
        bannedBy: session.userId || null,
      },
    });

    revalidatePath("/forum/admin/users");
    revalidatePath("/forum/admin");

    return { success: true };
  } catch (error) {
    console.error("Ban-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Hebt die Sperre eines Benutzers auf
 */
export async function unbanUser(userId: string): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        bannedBy: null,
      },
    });

    revalidatePath("/forum/admin/users");
    revalidatePath("/forum/admin");

    return { success: true };
  } catch (error) {
    console.error("Unban-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Löscht einen Benutzer (nur Admin)
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }

  const session = await getSession();

  // Verhindere, dass Admins sich selbst löschen
  if (session.userId === userId) {
    return {
      success: false,
      error: "Du kannst dich nicht selbst löschen",
    };
  }

  // Verhindere, dass der letzte Admin gelöscht wird
  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (adminCount === 1 && targetUser?.role === "ADMIN") {
    return {
      success: false,
      error: "Der letzte Administrator kann nicht gelöscht werden",
    };
  }

  try {
    // Cascade-Löschung: Threads und Posts werden automatisch gelöscht
    // Avatar-Datei löschen (falls vorhanden)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      const { unlink } = await import("fs/promises");
      const { join } = await import("path");
      const { existsSync } = await import("fs");
      const avatarPath = join(
        process.cwd(),
        "public",
        user.avatarUrl.replace(/^\//, "")
      );
      if (existsSync(avatarPath)) {
        await unlink(avatarPath);
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/forum/admin/users");
    revalidatePath("/forum/admin");

    return { success: true };
  } catch (error) {
    console.error("Benutzer-Lösch-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}
