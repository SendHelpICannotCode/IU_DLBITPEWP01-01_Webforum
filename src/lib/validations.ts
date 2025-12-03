import { z } from "zod";

/**
 * Zod-Schemas für Eingabevalidierung
 * Diese Schemas sind die erste Verteidigungslinie gegen ungültige Daten
 */

// ===== AUTH SCHEMAS =====

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Benutzername muss mindestens 3 Zeichen lang sein")
    .max(20, "Benutzername darf maximal 20 Zeichen lang sein")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten"
    ),
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: z
    .string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .max(100, "Passwort darf maximal 100 Zeichen lang sein"),
});

export const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

// ===== FORUM SCHEMAS (für Sprint 3) =====

export const createThreadSchema = z.object({
  title: z
    .string()
    .min(3, "Titel muss mindestens 3 Zeichen lang sein")
    .max(100, "Titel darf maximal 100 Zeichen lang sein"),
  content: z
    .string()
    .min(10, "Inhalt muss mindestens 10 Zeichen lang sein")
    .max(10000, "Inhalt darf maximal 10.000 Zeichen lang sein"),
});

export const updateThreadSchema = createThreadSchema.partial();

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Beitrag darf nicht leer sein")
    .max(5000, "Beitrag darf maximal 5.000 Zeichen lang sein"),
  threadId: z.string().cuid("Ungültige Thread-ID"),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "Beitrag darf nicht leer sein")
    .max(5000, "Beitrag darf maximal 5.000 Zeichen lang sein"),
});

// ===== TYPE EXPORTS =====

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
