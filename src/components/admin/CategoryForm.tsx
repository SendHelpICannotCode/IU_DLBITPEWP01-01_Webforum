"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, X, Tag } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import {
  createCategory,
  updateCategory,
  type ActionResult,
} from "@/actions/categories";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  keywords?: string[] | null;
}

interface CategoryFormProps {
  category?: Category | null;
  redirectOnSuccess?: string;
}

/**
 * CategoryForm - Wiederverwendbare Formular-Komponente für Erstellen/Bearbeiten von Kategorien
 */
export function CategoryForm({
  category,
  redirectOnSuccess,
}: CategoryFormProps) {
  const router = useRouter();
  const isEditMode = !!category;

  // Initialisiere State direkt aus category (wenn vorhanden)
  const initialKeywordsString = category?.keywords?.join(", ") || "";
  const initialKeywords = category?.keywords || [];

  const [keywordsInput, setKeywordsInput] = useState(initialKeywordsString);
  const [selectedKeywords, setSelectedKeywords] =
    useState<string[]>(initialKeywords);

  const action = isEditMode
    ? (prevState: ActionResult | null, formData: FormData) =>
        updateCategory(category.id, prevState, formData)
    : createCategory;

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  // Aktualisiere Keywords-Input wenn category.keywords sich ändert
  const currentKeywordsString = category?.keywords?.join(", ") || "";
  useEffect(() => {
    if (currentKeywordsString !== keywordsInput) {
      setKeywordsInput(currentKeywordsString);
      setSelectedKeywords(category?.keywords || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keywordsInput ist Teil der Bedingung, nicht Dependency
  }, [currentKeywordsString, category?.keywords]);

  // Bei Erfolg: Redirect oder Refresh
  useEffect(() => {
    if (state?.success) {
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      } else {
        router.refresh();
      }
    }
  }, [state?.success, redirectOnSuccess, router]);

  // Parse Keywords aus Input
  function parseKeywords(input: string): string[] {
    return input
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  function handleKeywordsInputChange(value: string) {
    setKeywordsInput(value);
    setSelectedKeywords(parseKeywords(value));
  }

  function handleAddKeyword(keyword: string) {
    const trimmed = keyword.trim();
    if (trimmed && !selectedKeywords.includes(trimmed)) {
      const newKeywords = [...selectedKeywords, trimmed];
      setSelectedKeywords(newKeywords);
      setKeywordsInput(newKeywords.join(", "));
    }
  }

  function handleRemoveKeyword(keyword: string) {
    const newKeywords = selectedKeywords.filter((k) => k !== keyword);
    setSelectedKeywords(newKeywords);
    setKeywordsInput(newKeywords.join(", "));
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Globaler Fehler */}
      {state?.error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div>
        <Input
          name="name"
          label="Name"
          placeholder="z.B. Technik, Allgemeines, Off-Topic"
          required
          minLength={2}
          maxLength={50}
          defaultValue={category?.name || ""}
          disabled={isPending}
          error={state?.fieldErrors?.name?.[0]}
          aria-invalid={state?.fieldErrors?.name ? "true" : undefined}
        />
      </div>

      {/* Beschreibung */}
      <div>
        <Textarea
          name="description"
          label="Beschreibung (optional)"
          placeholder="Kurze Beschreibung der Kategorie..."
          rows={3}
          maxLength={500}
          defaultValue={category?.description || ""}
          disabled={isPending}
          error={state?.fieldErrors?.description?.[0]}
          aria-invalid={state?.fieldErrors?.description ? "true" : undefined}
        />
      </div>

      {/* Farbe */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Farbe (optional)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="color-picker"
            defaultValue={category?.color || "#3b82f6"}
            className="h-10 w-20 rounded border border-slate-800 bg-slate-950/50 cursor-pointer"
            disabled={isPending}
            onChange={(e) => {
              // Aktualisiere das versteckte Input-Feld
              const hiddenInput = document.querySelector(
                'input[name="color"]'
              ) as HTMLInputElement;
              if (hiddenInput) {
                hiddenInput.value = e.target.value;
              }
            }}
          />
          <Input
            name="color"
            type="text"
            placeholder="#3b82f6"
            pattern="^#[0-9A-Fa-f]{6}$"
            maxLength={7}
            defaultValue={category?.color || ""}
            disabled={isPending}
            error={state?.fieldErrors?.color?.[0]}
            aria-invalid={state?.fieldErrors?.color ? "true" : undefined}
            className="flex-1"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Hex-Farbe im Format #RRGGBB (z.B. #3b82f6)
        </p>
      </div>

      {/* Schlagwörter */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Schlagwörter (optional)
        </label>
        <div className="space-y-2">
          {/* Ausgewählte Schlagwörter als Badges */}
          {selectedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300"
                >
                  <Tag className="h-3 w-3" />
                  {keyword}
                  {!isPending && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
                      aria-label={`${keyword} entfernen`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Input für neue Schlagwörter */}
          <Input
            type="text"
            placeholder="Schlagwörter durch Komma trennen (z.B. technik, code, programmierung)"
            value={keywordsInput}
            onChange={(e) => handleKeywordsInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const trimmed = keywordsInput.trim();
                if (trimmed) {
                  const keywords = parseKeywords(trimmed);
                  keywords.forEach((k) => handleAddKeyword(k));
                  setKeywordsInput("");
                }
              }
            }}
            disabled={isPending}
            className="flex-1"
          />
          <p className="mt-1 text-xs text-slate-500">
            Trenne mehrere Schlagwörter durch Kommas. Drücke Enter, um sie
            hinzuzufügen.
          </p>
        </div>
        {/* Hidden Input für FormData */}
        <input
          type="hidden"
          name="keywords"
          value={selectedKeywords.join(",")}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Wird gespeichert..." : "Wird erstellt..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? "Änderungen speichern" : "Kategorie erstellen"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
