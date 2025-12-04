"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui";
import { deleteThread } from "@/actions/threads";

interface DeleteThreadButtonProps {
  threadId: string;
}

export function DeleteThreadButton({ threadId }: DeleteThreadButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteThread(threadId);

      if (!result.success) {
        setError(result.error || "Fehler beim Löschen");
        setIsDeleting(false);
        return;
      }

      // Weiterleitung zur Forum-Übersicht
      router.push("/forum");
      router.refresh();
    } catch {
      setError("Ein Fehler ist aufgetreten");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="text-sm text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
      >
        <Trash2 className="h-3 w-3" />
        Löschen
      </button>

      {error && <span className="text-xs text-red-400 ml-2">{error}</span>}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Thema löschen"
        message="Möchtest du dieses Thema wirklich löschen? Alle Antworten werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Thema löschen"
        cancelText="Abbrechen"
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
}
