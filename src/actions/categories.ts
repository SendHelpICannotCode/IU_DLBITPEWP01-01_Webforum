"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { z } from "zod";

/**
 * Action Result Type für einheitliche Fehlerbehandlung
 */
export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Holt alle Kategorien
 */
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Holt eine einzelne Kategorie
 */
export async function getCategory(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { threads: true },
      },
    },
  });
}

/**
 * Durchsucht Kategorien nach Name oder Keywords
 * Unterstützt auch Teilwort-Suche in Keywords (z.B. "meme" findet "memes")
 */
export async function searchCategories(query: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // Lade alle Kategorien (für Teilwort-Suche in Keywords)
  // Bei vielen Kategorien könnte hier eine Raw SQL Query mit array_to_string + ILIKE performanter sein
  const allCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // Filtere in JavaScript, um Teilwort-Suche in Keywords zu ermöglichen
  return allCategories.filter((category) => {
    // Suche im Namen (case-insensitive, Teilwort)
    const nameMatch = category.name.toLowerCase().includes(searchTerm);

    // Suche in Keywords (case-insensitive, Teilwort)
    const keywordMatch = category.keywords.some((keyword) =>
      keyword.toLowerCase().includes(searchTerm)
    );

    return nameMatch || keywordMatch;
  });
}

/**
 * Holt Threads einer Kategorie (mit Pagination)
 */
export async function getThreadsByCategory(
  categoryId: string,
  page: number = 1,
  pageSize: number = 15
) {
  const skip = (page - 1) * pageSize;
  const validPage = Math.max(1, page);
  const validPageSize = [10, 15, 20, 50].includes(pageSize) ? pageSize : 15;

  const [threads, totalCount] = await Promise.all([
    prisma.thread.findMany({
      where: {
        categories: {
          some: {
            categoryId,
          },
        },
      },
      skip,
      take: validPageSize,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        _count: {
          select: { posts: true },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.thread.count({
      where: {
        categories: {
          some: {
            categoryId,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const finalPage = Math.min(validPage, totalPages);

  const finalThreads =
    finalPage !== validPage
      ? await prisma.thread.findMany({
          where: {
            categories: {
              some: {
                categoryId,
              },
            },
          },
          skip: (finalPage - 1) * validPageSize,
          take: validPageSize,
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
            _count: {
              select: { posts: true },
            },
            categories: {
              include: {
                category: true,
              },
            },
          },
        })
      : threads;

  return {
    threads: finalThreads,
    totalCount,
    page: finalPage,
    pageSize: validPageSize,
    totalPages,
  };
}

// ===== ADMIN FUNCTIONS =====

const categorySchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein").max(50),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ungültige Hex-Farbe")
    .optional(),
  keywords: z.array(z.string()).optional(),
});

/**
 * Erstellt eine neue Kategorie (nur Admin)
 */
export async function createCategory(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      success: false,
      error: "Nur Administratoren können Kategorien erstellen",
    };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
    keywords: formData.get("keywords")
      ? (formData.get("keywords") as string).split(",").map((k) => k.trim())
      : undefined,
  };

  const parsed = categorySchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    await prisma.category.create({
      data: parsed.data,
    });

    return { success: true };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Eine Kategorie mit diesem Namen existiert bereits",
      };
    }

    console.error("Kategorie-Erstellungsfehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Aktualisiert eine Kategorie (nur Admin)
 */
export async function updateCategory(
  categoryId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      success: false,
      error: "Nur Administratoren können Kategorien bearbeiten",
    };
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    return {
      success: false,
      error: "Kategorie nicht gefunden",
    };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
    keywords: formData.get("keywords")
      ? (formData.get("keywords") as string).split(",").map((k) => k.trim())
      : undefined,
  };

  const parsed = categorySchema.partial().safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: parsed.data,
    });

    return { success: true };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Eine Kategorie mit diesem Namen existiert bereits",
      };
    }

    console.error("Kategorie-Update-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Löscht eine Kategorie (nur Admin)
 */
export async function deleteCategory(
  categoryId: string
): Promise<ActionResult> {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      success: false,
      error: "Nur Administratoren können Kategorien löschen",
    };
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { threads: true },
      },
    },
  });

  if (!existingCategory) {
    return {
      success: false,
      error: "Kategorie nicht gefunden",
    };
  }

  if (existingCategory._count.threads > 0) {
    return {
      success: false,
      error:
        "Kategorie kann nicht gelöscht werden, da sie noch Threads zugeordnet hat",
    };
  }

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return { success: true };
  } catch (error) {
    console.error("Kategorie-Lösch-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}
