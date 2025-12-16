import { getCategories } from "@/actions/categories";

// Einfache Client-seitige Deduplizierung: verhindert doppelte Server-Action-Aufrufe
// beim Mount mehrerer Komponenten (und im Dev-StrictMode mit doppelten Effects).
let categoriesPromise: ReturnType<typeof getCategories> | null = null;

export function getCategoriesCached() {
  if (!categoriesPromise) {
    categoriesPromise = getCategories();
  }
  return categoriesPromise;
}
