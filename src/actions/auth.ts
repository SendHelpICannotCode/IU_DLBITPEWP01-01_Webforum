"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { registerSchema, loginSchema } from "@/lib/validations";

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
