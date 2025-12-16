"use server";

import { prisma, checkDatabaseConnection } from "@/lib/db";
import { getSession } from "@/lib/session";
import { updateProfileSchema, avatarSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

/**
 * Action Result Type für einheitliche Fehlerbehandlung
 */
export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Holt ein Benutzerprofil mit Statistiken (nach ID)
 */
export async function getUserProfile(userId: string) {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      preferences: true,
      lastActiveAt: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          threads: true,
          posts: true,
        },
      },
    },
  });

  return user;
}

/**
 * Holt ein Benutzerprofil mit Statistiken (nach Username)
 */
export async function getUserProfileByUsername(username: string) {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      preferences: true,
      lastActiveAt: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          threads: true,
          posts: true,
        },
      },
    },
  });

  return user;
}

/**
 * Aktualisiert ein Benutzerprofil
 */
export async function updateProfile(
  userId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();

  // Nur eigenes Profil oder Admin
  if (session.userId !== userId && session.role !== "ADMIN") {
    return {
      success: false,
      error: "Keine Berechtigung, dieses Profil zu bearbeiten",
    };
  }

  const rawData = {
    username: formData.get("username"),
    email: formData.get("email"),
    bio: formData.get("bio"),
    preferences: formData.get("preferences"),
  };

  // Validierung
  const parsed = updateProfileSchema.safeParse({
    username: rawData.username || undefined,
    email: rawData.email || undefined,
    bio: rawData.bio || undefined,
    preferences: rawData.preferences
      ? JSON.parse(rawData.preferences as string)
      : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { username, email, bio, preferences } = parsed.data;

  try {
    // Prüfe Eindeutigkeit von Username und E-Mail (falls geändert)
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        if (email && existingUser.email === email) {
          return {
            success: false,
            error: "Diese E-Mail-Adresse ist bereits registriert",
          };
        }
        if (username && existingUser.username === username) {
          return {
            success: false,
            error: "Dieser Benutzername ist bereits vergeben",
          };
        }
      }
    }

    // Hole aktuellen User, um alten Username zu bekommen (für revalidatePath)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    // Update durchführen
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(bio !== undefined && { bio }),
        ...(preferences && { preferences }),
      },
      select: { username: true },
    });

    revalidatePath("/user");
    // Revalidiere alten und neuen Username (falls geändert)
    if (currentUser) {
      revalidatePath(`/user/${currentUser.username}`);
    }
    revalidatePath(`/user/${updatedUser.username}`);

    return { success: true };
  } catch (error) {
    console.error("Profil-Update-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Lädt einen Avatar hoch
 */
export async function uploadAvatar(
  userId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();

  // Nur eigenes Profil oder Admin
  if (session.userId !== userId && session.role !== "ADMIN") {
    return {
      success: false,
      error: "Keine Berechtigung, dieses Profil zu bearbeiten",
    };
  }

  const file = formData.get("avatar") as File | null;

  if (!file) {
    return {
      success: false,
      error: "Keine Datei ausgewählt",
    };
  }

  // Validierung
  const parsed = avatarSchema.safeParse({
    mimeType: file.type,
    size: file.size,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Ungültige Datei",
    };
  }

  try {
    // Alten Avatar löschen (falls vorhanden)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, username: true },
    });

    if (user?.avatarUrl) {
      const oldAvatarPath = join(
        process.cwd(),
        "public",
        user.avatarUrl.replace(/^\//, "")
      );
      if (existsSync(oldAvatarPath)) {
        await unlink(oldAvatarPath);
      }
    }

    // Neuen Avatar speichern
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Erstelle avatars-Verzeichnis falls nicht vorhanden
    const avatarsDir = join(process.cwd(), "public", "avatars");
    if (!existsSync(avatarsDir)) {
      mkdirSync(avatarsDir, { recursive: true });
    }

    // Generiere eindeutigen Dateinamen
    const fileExtension = file.type === "image/png" ? "png" : "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;
    const filePath = join(avatarsDir, fileName);

    await writeFile(filePath, buffer);

    // Avatar-URL in Datenbank speichern
    const avatarUrl = `/avatars/${fileName}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { username: true },
    });

    revalidatePath("/user");
    if (user?.username) {
      revalidatePath(`/user/${user.username}`);
    }
    revalidatePath(`/user/${updatedUser.username}`);

    return { success: true };
  } catch (error) {
    console.error("Avatar-Upload-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Entfernt einen Avatar
 */
export async function removeAvatar(userId: string): Promise<ActionResult> {
  const session = await getSession();

  // Nur eigenes Profil oder Admin
  if (session.userId !== userId && session.role !== "ADMIN") {
    return {
      success: false,
      error: "Keine Berechtigung, dieses Profil zu bearbeiten",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, username: true },
    });

    if (user?.avatarUrl) {
      const avatarPath = join(
        process.cwd(),
        "public",
        user.avatarUrl.replace(/^\//, "")
      );
      if (existsSync(avatarPath)) {
        await unlink(avatarPath);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    revalidatePath("/user");
    if (user?.username) {
      revalidatePath(`/user/${user.username}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Avatar-Entfernen-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Holt Statistiken für einen Benutzer (nach ID)
 */
export async function getUserStats(userId: string) {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    return null;
  }

  const [user, recentThreads, recentPosts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            posts: true,
          },
        },
      },
    }),
    prisma.thread.findMany({
      where: { authorId: userId },
      take: 5,
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
      take: 5,
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

  if (!user) {
    return null;
  }

  return {
    user,
    recentThreads,
    recentPosts,
  };
}

/**
 * Holt Statistiken für einen Benutzer (nach Username)
 */
export async function getUserStatsByUsername(username: string) {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    return null;
  }

  const [user, recentThreads, recentPosts] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            posts: true,
          },
        },
      },
    }),
    prisma.thread.findMany({
      where: { author: { username } },
      take: 5,
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
      where: { author: { username } },
      take: 5,
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

  if (!user) {
    return null;
  }

  return {
    user,
    recentThreads,
    recentPosts,
  };
}
