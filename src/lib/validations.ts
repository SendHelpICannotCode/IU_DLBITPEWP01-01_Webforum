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
  categoryIds: z.array(z.string().cuid()).optional(),
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

// ===== PAGINATION SCHEMAS =====

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine(
      (val) => [10, 15, 20, 50].includes(val),
      "Seitengröße muss 10, 15, 20 oder 50 sein"
    )
    .default(15),
});

// ===== SEARCH SCHEMAS =====

export const searchSchema = z.object({
  query: z
    .string()
    .min(2, "Suchbegriff muss mindestens 2 Zeichen lang sein")
    .max(100, "Suchbegriff darf maximal 100 Zeichen lang sein")
    .trim(),
});

export const searchParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      // Wenn leer oder undefined, ist es OK
      if (!val || val.length === 0) return true;
      // Wenn gesetzt, muss es mindestens 2 Zeichen haben
      return val.length >= 2;
    }, "Suchbegriff muss mindestens 2 Zeichen lang sein")
    .refine((val) => {
      // Wenn leer oder undefined, ist es OK
      if (!val || val.length === 0) return true;
      // Wenn gesetzt, darf es maximal 100 Zeichen haben
      return val.length <= 100;
    }, "Suchbegriff darf maximal 100 Zeichen lang sein"),
  type: z.enum(["threads", "posts", "users", "all"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine(
      (val) => [10, 15, 20, 50].includes(val),
      "Seitengröße muss 10, 15, 20 oder 50 sein"
    )
    .default(15),
  // Erweiterte Filter
  dateRange: z.enum(["week", "month", "year", "all"]).optional(),
  categories: z.string().optional(), // Komma-getrennte Kategorie-IDs
  author: z.string().min(1).max(20).optional(), // Username (primär)
  authorId: z.string().cuid().optional(), // ID (Fallback für Robustheit)
});

// ===== TYPE EXPORTS =====

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type SearchParamsInput = z.infer<typeof searchParamsSchema>;

// ===== PROFILE SCHEMAS =====

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Benutzername muss mindestens 3 Zeichen lang sein")
    .max(20, "Benutzername darf maximal 20 Zeichen lang sein")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten"
    )
    .optional(),
  email: z
    .string()
    .email("Bitte gib eine gültige E-Mail-Adresse ein")
    .optional(),
  bio: z
    .string()
    .max(500, "Profilbeschreibung darf maximal 500 Zeichen lang sein")
    .optional(),
  preferences: z.record(z.any()).optional(), // JSON-Objekt
  emailPublic: z.boolean().optional(), // Email-Sichtbarkeit
});

export const avatarSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/jpg", "image/png"], {
    errorMap: () => ({
      message: "Nur JPEG und PNG Dateien sind erlaubt",
    }),
  }),
  size: z.number().max(2 * 1024 * 1024, "Datei darf maximal 2MB groß sein"), // 2MB
});

// ===== PASSWORD CHANGE SCHEMA =====

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Altes Passwort ist erforderlich"),
    newPassword: z
      .string()
      .min(8, "Neues Passwort muss mindestens 8 Zeichen lang sein")
      .max(100, "Neues Passwort darf maximal 100 Zeichen lang sein"),
    confirmPassword: z.string().min(1, "Passwort-Bestätigung ist erforderlich"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

// ===== ADMIN SCHEMAS =====

export const updateUserRoleSchema = z.object({
  userId: z.string().cuid("Ungültige Benutzer-ID"),
  role: z.enum(["USER", "ADMIN"], {
    errorMap: () => ({
      message: "Rolle muss USER oder ADMIN sein",
    }),
  }),
});

export const banUserSchema = z.object({
  userId: z.string().cuid("Ungültige Benutzer-ID"),
  reason: z
    .string()
    .max(500, "Grund darf maximal 500 Zeichen lang sein")
    .optional(),
  until: z.coerce.date().optional(), // Temporäre Sperre
});

export const unbanUserSchema = z.object({
  userId: z.string().cuid("Ungültige Benutzer-ID"),
});

export const deleteUserSchema = z.object({
  userId: z.string().cuid("Ungültige Benutzer-ID"),
});

// ===== TYPE EXPORTS =====

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AvatarInput = z.infer<typeof avatarSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
