"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Save, X } from "lucide-react";
import { Modal } from "@/components/ui";
import { Input, Textarea, Button } from "@/components/ui";
import { updateThread } from "@/actions/threads";

interface EditThreadButtonProps {
  threadId: string;
  currentTitle: string;
  currentContent: string;
}

export function EditThreadButton({
  threadId,
  currentTitle,
  currentContent,
}: EditThreadButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

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

      // Erfolg: Modal schließen und Seite neu laden
      setIsModalOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
      >
        <Pencil className="h-3 w-3" />
        Bearbeiten
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thema bearbeiten"
        className="max-w-lg"
      >
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
              <p className="mt-1 text-sm text-red-400">
                {fieldErrors.title[0]}
              </p>
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

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
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
      </Modal>
    </>
  );
}
