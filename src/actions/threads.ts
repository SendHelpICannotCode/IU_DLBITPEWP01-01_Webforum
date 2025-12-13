"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, checkDatabaseConnection } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createThreadSchema, updateThreadSchema } from "@/lib/validations";

/**
 * Action Result Type für einheitliche Fehlerbehandlung
 */
export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Rückgabetyp für getThreads mit optionalem Datenbankfehler
 */
export type GetThreadsResult = {
  threads: Awaited<ReturnType<typeof fetchThreads>>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  dbError: boolean;
};

async function fetchThreads(
  page: number,
  pageSize: number,
  categoryIds?: string[]
) {
  const skip = (page - 1) * pageSize;
  return prisma.thread.findMany({
    skip,
    take: pageSize,
    where:
      categoryIds && categoryIds.length > 0
        ? {
            categories: {
              some: {
                categoryId: {
                  in: categoryIds,
                },
              },
            },
          }
        : undefined,
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
  });
}

/**
 * Holt alle Threads mit Autor und Antworten-Zähler (mit Pagination)
 * Nutzt den gecacheten DB-Status - wird nur einmal pro Request geprüft
 */
export async function getThreads(
  page: number = 1,
  pageSize: number = 15,
  categoryIds?: string[]
): Promise<GetThreadsResult> {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    return {
      threads: [],
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
      dbError: true,
    };
  }

  // Validierung: page muss >= 1 sein
  const validPage = Math.max(1, page);
  // Validierung: pageSize muss erlaubter Wert sein
  const validPageSize = [10, 15, 20, 50].includes(pageSize) ? pageSize : 15;

  // Filter für Kategorien
  const whereClause =
    categoryIds && categoryIds.length > 0
      ? {
          categories: {
            some: {
              categoryId: {
                in: categoryIds,
              },
            },
          },
        }
      : undefined;

  // Parallel: Threads laden und totalCount ermitteln
  const [threads, totalCount] = await Promise.all([
    fetchThreads(validPage, validPageSize, categoryIds),
    prisma.thread.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const finalPage = Math.min(validPage, totalPages);

  // Falls page > totalPages, nochmal mit korrigierter page laden
  const finalThreads =
    finalPage !== validPage
      ? await fetchThreads(finalPage, validPageSize, categoryIds)
      : threads;

  return {
    threads: finalThreads,
    totalCount,
    page: finalPage,
    pageSize: validPageSize,
    totalPages,
    dbError: false,
  };
}

/**
 * Rückgabetyp für getThread
 */
export type GetThreadResult = {
  thread: Awaited<ReturnType<typeof fetchThread>> | null;
  posts: Awaited<ReturnType<typeof fetchPosts>>;
  postsCount: number;
  postsPage: number;
  postsPageSize: number;
  postsTotalPages: number;
  dbError: boolean;
};

async function fetchThread(id: string) {
  return prisma.thread.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
}

async function fetchPosts(threadId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  return prisma.post.findMany({
    where: { threadId },
    skip,
    take: pageSize,
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Holt einen einzelnen Thread mit paginierten Posts
 * Nutzt den gecacheten DB-Status
 */
export async function getThread(
  id: string,
  postsPage: number = 1,
  postsPageSize: number = 10
): Promise<GetThreadResult> {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    return {
      thread: null,
      posts: [],
      postsCount: 0,
      postsPage: 1,
      postsPageSize: 10,
      postsTotalPages: 0,
      dbError: true,
    };
  }

  // Validierung: postsPage muss >= 1 sein
  const validPostsPage = Math.max(1, postsPage);
  // Validierung: postsPageSize muss erlaubter Wert sein
  const validPostsPageSize = [10, 15, 20, 50].includes(postsPageSize)
    ? postsPageSize
    : 10;

  // Parallel: Thread und Posts laden, sowie Posts-Count ermitteln
  const [thread, posts, postsCount] = await Promise.all([
    fetchThread(id),
    fetchPosts(id, validPostsPage, validPostsPageSize),
    prisma.post.count({ where: { threadId: id } }),
  ]);

  if (!thread) {
    return {
      thread: null,
      posts: [],
      postsCount: 0,
      postsPage: 1,
      postsPageSize: validPostsPageSize,
      postsTotalPages: 0,
      dbError: false,
    };
  }

  const postsTotalPages = Math.max(
    1,
    Math.ceil(postsCount / validPostsPageSize)
  );
  const finalPostsPage = Math.min(validPostsPage, postsTotalPages);

  // Falls postsPage > postsTotalPages, nochmal mit korrigierter page laden
  const finalPosts =
    finalPostsPage !== validPostsPage
      ? await fetchPosts(id, finalPostsPage, validPostsPageSize)
      : posts;

  return {
    thread,
    posts: finalPosts,
    postsCount,
    postsPage: finalPostsPage,
    postsPageSize: validPostsPageSize,
    postsTotalPages,
    dbError: false,
  };
}

/**
 * Erstellt einen neuen Thread
 */
export async function createThread(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Session prüfen
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return {
      success: false,
      error: "Du musst eingeloggt sein, um ein Thema zu erstellen",
    };
  }

  // 2. Eingaben extrahieren
  const categoryIdsInput = formData.get("categoryIds");
  const categoryIds = categoryIdsInput
    ? (categoryIdsInput as string).split(",").filter((id) => id.trim())
    : undefined;

  const rawData = {
    title: formData.get("title"),
    content: formData.get("content"),
    categoryIds:
      categoryIds && categoryIds.length > 0 ? categoryIds : undefined,
  };

  // 3. Zod-Validierung
  const parsed = createThreadSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { title, content, categoryIds: validCategoryIds } = parsed.data;

  try {
    // 4. Thread erstellen
    const thread = await prisma.thread.create({
      data: {
        title,
        content,
        authorId: session.userId,
        categories:
          validCategoryIds && validCategoryIds.length > 0
            ? {
                create: validCategoryIds.map((categoryId) => ({
                  categoryId,
                })),
              }
            : undefined,
      },
    });

    // 5. Cache invalidieren
    revalidatePath("/forum");

    // 6. Zum neuen Thread weiterleiten
    redirect(`/forum/thread/${thread.id}`);
  } catch (error) {
    // Redirect wirft einen speziellen Error - diesen durchlassen
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Thread-Erstellungsfehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }

  // Unreachable, aber TypeScript benötigt es
  return { success: true };
}

/**
 * Aktualisiert einen Thread
 */
export async function updateThread(
  threadId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Session prüfen
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return {
      success: false,
      error: "Du musst eingeloggt sein, um ein Thema zu bearbeiten",
    };
  }

  // 2. Thread holen und Berechtigung prüfen
  const existingThread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!existingThread) {
    return {
      success: false,
      error: "Thema nicht gefunden",
    };
  }

  // Nur Autor oder Admin darf bearbeiten
  const isAuthor = existingThread.authorId === session.userId;
  const isAdmin = session.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      error: "Du hast keine Berechtigung, dieses Thema zu bearbeiten",
    };
  }

  // 3. Eingaben extrahieren
  const categoryIdsInput = formData.get("categoryIds");
  const categoryIds = categoryIdsInput
    ? (categoryIdsInput as string).split(",").filter((id) => id.trim())
    : undefined;

  const rawData = {
    title: formData.get("title"),
    content: formData.get("content"),
    categoryIds:
      categoryIds && categoryIds.length > 0 ? categoryIds : undefined,
  };

  // 4. Zod-Validierung
  const parsed = updateThreadSchema.safeParse(rawData);

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
    // 5. Alte Version speichern (Versionierung)
    await prisma.threadVersion.create({
      data: {
        threadId: existingThread.id,
        version: existingThread.currentVersion,
        title: existingThread.title,
        content: existingThread.content,
      },
    });

    // 6. Kategorien aktualisieren (wenn categoryIds vorhanden)
    if (parsed.data.categoryIds !== undefined) {
      // Alte Zuordnungen löschen
      await prisma.threadCategory.deleteMany({
        where: { threadId },
      });

      // Neue Zuordnungen erstellen (falls vorhanden)
      if (parsed.data.categoryIds.length > 0) {
        await prisma.threadCategory.createMany({
          data: parsed.data.categoryIds.map((categoryId) => ({
            threadId,
            categoryId,
          })),
        });
      }
    }

    // 7. Thread aktualisieren mit erhöhter Versionsnummer
    await prisma.thread.update({
      where: { id: threadId },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        currentVersion: existingThread.currentVersion + 1,
      },
    });

    // 8. Cache invalidieren
    revalidatePath("/forum");
    revalidatePath(`/forum/thread/${threadId}`);

    return { success: true };
  } catch (error) {
    console.error("Thread-Update-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Holt alle Versionen eines Threads
 */
export async function getThreadVersions(threadId: string) {
  const versions = await prisma.threadVersion.findMany({
    where: { threadId },
    orderBy: { version: "asc" },
  });

  return versions;
}

/**
 * Holt eine spezifische Version eines Threads
 */
export async function getThreadVersion(threadId: string, version: number) {
  const threadVersion = await prisma.threadVersion.findUnique({
    where: {
      threadId_version: {
        threadId,
        version,
      },
    },
  });

  return threadVersion;
}

/**
 * Sperrt einen Thread (nur Admin)
 */
export async function lockThread(threadId: string): Promise<ActionResult> {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      success: false,
      error: "Nur Administratoren können Threads sperren",
    };
  }

  const existingThread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!existingThread) {
    return {
      success: false,
      error: "Thema nicht gefunden",
    };
  }

  if (existingThread.isLocked) {
    return {
      success: false,
      error: "Thread ist bereits gesperrt",
    };
  }

  try {
    await prisma.thread.update({
      where: { id: threadId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: session.userId,
      },
    });

    revalidatePath(`/forum/thread/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error("Thread-Sperr-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Entsperrt einen Thread (nur Admin)
 */
export async function unlockThread(threadId: string): Promise<ActionResult> {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      success: false,
      error: "Nur Administratoren können Threads entsperren",
    };
  }

  const existingThread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!existingThread) {
    return {
      success: false,
      error: "Thema nicht gefunden",
    };
  }

  if (!existingThread.isLocked) {
    return {
      success: false,
      error: "Thread ist nicht gesperrt",
    };
  }

  try {
    await prisma.thread.update({
      where: { id: threadId },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
      },
    });

    revalidatePath(`/forum/thread/${threadId}`);
    return { success: true };
  } catch (error) {
    console.error("Thread-Entsperr-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Holt alle gesperrten Threads (nur Admin, mit Pagination)
 */
export async function getLockedThreads(
  page: number = 1,
  pageSize: number = 15
) {
  const session = await getSession();

  if (!session.isLoggedIn || session.role !== "ADMIN") {
    return {
      threads: [],
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
    };
  }

  const validPage = Math.max(1, page);
  const validPageSize = [10, 15, 20, 50].includes(pageSize) ? pageSize : 15;
  const skip = (validPage - 1) * validPageSize;

  const [threads, totalCount] = await Promise.all([
    prisma.thread.findMany({
      where: { isLocked: true },
      skip,
      take: validPageSize,
      orderBy: { lockedAt: "desc" },
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
      where: { isLocked: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const finalPage = Math.min(validPage, totalPages);

  const finalThreads =
    finalPage !== validPage
      ? await prisma.thread.findMany({
          where: { isLocked: true },
          skip: (finalPage - 1) * validPageSize,
          take: validPageSize,
          orderBy: { lockedAt: "desc" },
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

/**
 * Löscht einen Thread
 */
export async function deleteThread(threadId: string): Promise<ActionResult> {
  // 1. Session prüfen
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return {
      success: false,
      error: "Du musst eingeloggt sein, um ein Thema zu löschen",
    };
  }

  // 2. Thread holen und Berechtigung prüfen
  const existingThread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!existingThread) {
    return {
      success: false,
      error: "Thema nicht gefunden",
    };
  }

  // Nur Autor oder Admin darf löschen
  const isAuthor = existingThread.authorId === session.userId;
  const isAdmin = session.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      error: "Du hast keine Berechtigung, dieses Thema zu löschen",
    };
  }

  try {
    // 3. Thread löschen (Cascade löscht auch alle Posts)
    await prisma.thread.delete({
      where: { id: threadId },
    });

    // 4. Cache invalidieren
    revalidatePath("/forum");

    return { success: true };
  } catch (error) {
    console.error("Thread-Lösch-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}
