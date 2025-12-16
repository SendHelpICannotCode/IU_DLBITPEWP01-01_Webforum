"use client";

import { useActionState, useState, useEffect } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { createThread, type ActionResult } from "@/actions/threads";
import { CategoryTagsInput } from "./CategoryTagsInput";
import { getCategoriesCached } from "@/lib/categoriesClientCache";

export function ThreadForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(createThread, null);
  const [availableCategories, setAvailableCategories] = useState<
    Array<{ id: string; name: string; color?: string | null }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<
    Array<{ id: string; name: string; color?: string | null }>
  >([]);

  // Lade verfügbare Kategorien
  useEffect(() => {
    getCategoriesCached().then(setAvailableCategories).catch(console.error);
  }, []);

  return (
    <form action={formAction} className="space-y-4">
      {/* Globaler Fehler */}
      {state?.error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Titel */}
      <div>
        <Input
          name="title"
          placeholder="Titel des Themas"
          required
          minLength={3}
          maxLength={100}
          disabled={isPending}
          aria-invalid={state?.fieldErrors?.title ? "true" : undefined}
        />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-sm text-red-400">
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      {/* Inhalt */}
      <div>
        <Textarea
          name="content"
          placeholder="Beschreibe dein Thema oder stelle eine Frage..."
          rows={5}
          required
          minLength={10}
          maxLength={10000}
          disabled={isPending}
          aria-invalid={state?.fieldErrors?.content ? "true" : undefined}
        />
        {state?.fieldErrors?.content && (
          <p className="mt-1 text-sm text-red-400">
            {state.fieldErrors.content[0]}
          </p>
        )}
      </div>

      {/* Kategorien */}
      <CategoryTagsInput
        selectedCategories={selectedCategories}
        availableCategories={availableCategories}
        onChange={setSelectedCategories}
        disabled={isPending}
      />

      {/* Submit Button */}
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wird erstellt...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thema erstellen
          </>
        )}
      </Button>
    </form>
  );
}
