"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { Input, Textarea, Button } from "@/components/ui";
import { updateThread } from "@/actions/threads";
import { CategoryTagsInput } from "./CategoryTagsInput";
import { getCategories } from "@/actions/categories";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface ThreadEditorProps {
  threadId: string;
  currentTitle: string;
  currentContent: string;
  currentCategories?: Category[];
  onCancel: () => void;
  onSuccess: () => void;
}

export function ThreadEditor({
  threadId,
  currentTitle,
  currentContent,
  currentCategories = [],
  onCancel,
  onSuccess,
}: ThreadEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] =
    useState<Category[]>(currentCategories);

  // Lade verfügbare Kategorien
  useEffect(() => {
    getCategories().then(setAvailableCategories).catch(console.error);
  }, []);

  // Aktualisiere selectedCategories wenn currentCategories sich ändert
  useEffect(() => {
    setSelectedCategories(currentCategories);
  }, [currentCategories]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateThread(threadId, null, formData);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        if (result.error) {
          setError(result.error);
        }
        return;
      }

      // Erfolg
      onSuccess();
      router.refresh();
    });
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
      <form action={handleSubmit} className="space-y-4">
        {/* Globaler Fehler */}
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Titel */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Titel
          </label>
          <Input
            name="title"
            defaultValue={currentTitle}
            required
            minLength={3}
            maxLength={100}
            disabled={isPending}
            aria-invalid={fieldErrors.title ? "true" : undefined}
          />
          {fieldErrors.title && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Inhalt */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Inhalt
          </label>
          <Textarea
            name="content"
            defaultValue={currentContent}
            rows={6}
            required
            minLength={10}
            maxLength={10000}
            disabled={isPending}
            aria-invalid={fieldErrors.content ? "true" : undefined}
          />
          {fieldErrors.content && (
            <p className="mt-1 text-sm text-red-400">
              {fieldErrors.content[0]}
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

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Abbrechen
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
