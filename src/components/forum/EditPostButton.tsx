"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { Textarea, Button } from "@/components/ui";
import { updatePost } from "@/actions/posts";

interface EditPostButtonProps {
  postId: string;
  currentContent: string;
}

export function EditPostButton({
  postId,
  currentContent,
}: EditPostButtonProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updatePost(postId, null, formData);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        if (result.error) {
          setError(result.error);
        }
        return;
      }

      // Erfolg: Edit-Modus beenden und Seite neu laden
      setIsEditing(false);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <div className="mt-4 pt-3 border-t border-slate-800">
        <form action={handleSubmit} className="space-y-3">
          {/* Globaler Fehler */}
          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Textarea
            name="content"
            defaultValue={currentContent}
            rows={4}
            required
            minLength={1}
            maxLength={5000}
            disabled={isPending}
            aria-invalid={fieldErrors.content ? "true" : undefined}
            className="text-sm"
          />
          {fieldErrors.content && (
            <p className="text-sm text-red-400">{fieldErrors.content[0]}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Abbrechen
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
    >
      Bearbeiten
    </button>
  );
}
