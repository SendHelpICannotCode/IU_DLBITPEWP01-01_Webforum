"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getSession } from "@/lib/session";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Action Result Type für einheitliche Fehlerbehandlung
 */
export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Registriert einen neuen Benutzer
 */
export async function register(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Eingaben extrahieren
  const rawData = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // 2. Zod-Validierung
  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { username, email, password } = parsed.data;

  try {
    // 3. Prüfen ob E-Mail oder Username bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return {
          success: false,
          error: "Diese E-Mail-Adresse ist bereits registriert",
        };
      }
      return {
        success: false,
        error: "Dieser Benutzername ist bereits vergeben",
      };
    }

    // 4. Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Benutzer erstellen
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    // 6. Session erstellen
    await createSession({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Registrierungsfehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }

  // 7. Weiterleitung zum Forum
  redirect("/forum");
}

/**
 * Meldet einen Benutzer an
 */
export async function login(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Eingaben extrahieren
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // 2. Zod-Validierung
  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { email, password } = parsed.data;

  try {
    // 3. Benutzer suchen
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "E-Mail oder Passwort ist falsch",
      };
    }

    // 4. Passwort prüfen
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return {
        success: false,
        error: "E-Mail oder Passwort ist falsch",
      };
    }

    // 5. Session erstellen
    await createSession({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Login-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }

  // 6. Weiterleitung zum Forum
  redirect("/forum");
}

/**
 * Meldet den Benutzer ab
 */
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

/**
 * Ändert das Passwort eines Benutzers
 */
export async function changePassword(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "Nicht angemeldet",
    };
  }

  const rawData = {
    oldPassword: formData.get("oldPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  // Validierung
  const parsed = changePasswordSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { oldPassword, newPassword } = parsed.data;

  try {
    // Benutzer laden
    const user = await prisma.user.findUnique({
      where: { id: session.userId! },
    });

    if (!user) {
      return {
        success: false,
        error: "Benutzer nicht gefunden",
      };
    }

    // Altes Passwort prüfen
    const passwordMatch = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!passwordMatch) {
      return {
        success: false,
        error: "Altes Passwort ist falsch",
      };
    }

    // Neues Passwort hashen und speichern
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId! },
      data: { passwordHash },
    });

    revalidatePath("/user");
    revalidatePath("/user/edit");

    return { success: true };
  } catch (error) {
    console.error("Passwort-Änderungs-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

/**
 * Löscht ein Benutzerkonto (DSGVO - Recht auf Vergessenwerden)
 */
export async function deleteAccount(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "Nicht angemeldet",
    };
  }

  const password = formData.get("password") as string | null;
  const confirmDelete = formData.get("confirmDelete") === "true";

  if (!password) {
    return {
      success: false,
      error: "Passwort ist erforderlich",
    };
  }

  if (!confirmDelete) {
    return {
      success: false,
      error: "Bitte bestätige die Löschung",
    };
  }

  try {
    // Benutzer laden
    const user = await prisma.user.findUnique({
      where: { id: session.userId! },
      select: {
        id: true,
        passwordHash: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Benutzer nicht gefunden",
      };
    }

    // Passwort prüfen
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return {
        success: false,
        error: "Passwort ist falsch",
      };
    }

    // Avatar-Datei löschen (falls vorhanden)
    if (user.avatarUrl) {
      const avatarPath = join(
        process.cwd(),
        "public",
        user.avatarUrl.replace(/^\//, "")
      );
      if (existsSync(avatarPath)) {
        try {
          await unlink(avatarPath);
        } catch (error) {
          console.error("Fehler beim Löschen des Avatars:", error);
          // Weiter mit Löschung, auch wenn Avatar-Löschung fehlschlägt
        }
      }
    }

    // Session zerstören (vor dem Löschen des Users)
    await destroySession();

    // User löschen (Cascade löscht automatisch Threads und Posts)
    await prisma.user.delete({
      where: { id: session.userId! },
    });

    // Redirect erfolgt nach destroySession
    redirect("/");
  } catch (error) {
    console.error("Konto-Löschungs-Fehler:", error);
    return {
      success: false,
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}
