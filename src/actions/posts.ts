"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createPostSchema, updatePostSchema } from "@/lib/validations";

/**
 * Action Result Type für einheitliche Fehlerbehandlung
 */
export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Erstellt einen neuen Post (Antwort auf einen Thread)
 */
export async function createPost(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Session prüfen
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return {
      success: false,
      error: "Du musst eingeloggt sein, um zu antworten",
    };
  }

  // 2. Eingaben extrahieren
  const rawData = {
    content: formData.get("content"),
    threadId: formData.get("threadId"),
  };

  // 3. Zod-Validierung
  const parsed = createPostSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { content, threadId } = parsed.data;

  try {
    // 4. Prüfen ob Thread existiert und nicht gesperrt ist
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, isLocked: true },
    });

    if (!thread) {
      return {
        success: false,
        error: "Das Thema existiert nicht mehr",
      };
    }

    if (thread.isLocked) {
      return {
        success: false,
        error:
          "Dieses Thema ist gesperrt. Es können keine weiteren Antworten hinzugefügt werden.",
      };
    }

    // 5. Post erstellen
    await prisma.post.create({
      data: {
        content,
        threadId,
        authorId: session.userId,
      },
    });

    // 6. Cache invalidieren
    revalidatePath(`/forum/thread/${threadId}`);
    revalidatePath("/forum");

    return { success: true };
  } catch (error) {
    console.error("Post-Erstellungsfehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Aktualisiert einen Post
 */
export async function updatePost(
  postId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Session prüfen
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return {
      success: false,
      error: "Du musst eingeloggt sein, um einen Beitrag zu bearbeiten",
    };
  }

  // 2. Post holen und Berechtigung prüfen
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    return {
      success: false,
      error: "Beitrag nicht gefunden",
    };
  }

  // Nur Autor oder Admin darf bearbeiten
  const isAuthor = existingPost.authorId === session.userId;
  const isAdmin = session.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      error: "Du hast keine Berechtigung, diesen Beitrag zu bearbeiten",
    };
  }

  // 3. Eingaben extrahieren
  const rawData = {
    content: formData.get("content"),
  };

  // 4. Zod-Validierung
  const parsed = updatePostSchema.safeParse(rawData);

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
    await prisma.postVersion.create({
      data: {
        postId: existingPost.id,
        version: existingPost.currentVersion,
        content: existingPost.content,
      },
    });

    // 6. Post aktualisieren mit erhöhter Versionsnummer
    await prisma.post.update({
      where: { id: postId },
      data: {
        ...parsed.data,
        currentVersion: existingPost.currentVersion + 1,
      },
    });

    // 7. Cache invalidieren
    revalidatePath(`/forum/thread/${existingPost.threadId}`);

    return { success: true };
  } catch (error) {
    console.error("Post-Update-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Holt alle Versionen eines Posts
 */
export async function getPostVersions(postId: string) {
  const versions = await prisma.postVersion.findMany({
    where: { postId },
    orderBy: { version: "asc" },
  });

  return versions;
}

/**
 * Holt eine spezifische Version eines Posts
 */
export async function getPostVersion(postId: string, version: number) {
  const postVersion = await prisma.postVersion.findUnique({
    where: {
      postId_version: {
        postId,
        version,
      },
    },
  });

  return postVersion;
}

/**
 * Löscht einen Post
 */
export async function deletePost(postId: string): Promise<ActionResult> {
  // 1. Session prüfen
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return {
      success: false,
      error: "Du musst eingeloggt sein, um einen Beitrag zu löschen",
    };
  }

  // 2. Post holen und Berechtigung prüfen
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!existingPost) {
    return {
      success: false,
      error: "Beitrag nicht gefunden",
    };
  }

  // Nur Autor oder Admin darf löschen
  const isAuthor = existingPost.authorId === session.userId;
  const isAdmin = session.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      error: "Du hast keine Berechtigung, diesen Beitrag zu löschen",
    };
  }

  try {
    // 3. Post löschen
    await prisma.post.delete({
      where: { id: postId },
    });

    // 4. Cache invalidieren
    revalidatePath(`/forum/thread/${existingPost.threadId}`);
    revalidatePath("/forum");

    return { success: true };
  } catch (error) {
    console.error("Post-Lösch-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}
