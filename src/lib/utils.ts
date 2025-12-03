import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kombiniert Tailwind-Klassen intelligent
 * - Nutzt clsx für bedingte Klassen
 * - Nutzt twMerge um Konflikte zu lösen (z.B. "p-4 p-2" → "p-2")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
