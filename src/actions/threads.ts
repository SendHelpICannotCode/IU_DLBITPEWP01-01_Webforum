"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
 * Holt alle Threads mit Autor und Antworten-Zähler
 */
export async function getThreads() {
  const threads = await prisma.thread.findMany({
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
    },
  });

  return threads;
}

/**
 * Holt einen einzelnen Thread mit Posts
 */
export async function getThread(id: string) {
  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
      posts: {
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
      },
    },
  });

  return thread;
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
  const rawData = {
    title: formData.get("title"),
    content: formData.get("content"),
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

  const { title, content } = parsed.data;

  try {
    // 4. Thread erstellen
    const thread = await prisma.thread.create({
      data: {
        title,
        content,
        authorId: session.userId,
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
  const rawData = {
    title: formData.get("title"),
    content: formData.get("content"),
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

    // 6. Thread aktualisieren mit erhöhter Versionsnummer
    await prisma.thread.update({
      where: { id: threadId },
      data: {
        ...parsed.data,
        currentVersion: existingThread.currentVersion + 1,
      },
    });

    // 7. Cache invalidieren
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
