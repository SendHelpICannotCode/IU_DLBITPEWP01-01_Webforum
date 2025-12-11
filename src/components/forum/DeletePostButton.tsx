"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui";
import { deletePost } from "@/actions/posts";

interface DeletePostButtonProps {
  postId: string;
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deletePost(postId);

      if (!result.success) {
        setError(result.error || "Fehler beim Löschen");
        setIsDeleting(false);
        setIsModalOpen(false);
        return;
      }

      // Seite neu laden
      setIsModalOpen(false);
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
        className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
      >
        {isDeleting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Löschen...
          </>
        ) : (
          "Löschen"
        )}
      </button>

      {error && <span className="text-xs text-red-400 ml-2">{error}</span>}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Beitrag löschen"
        message="Möchtest du diesen Beitrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Beitrag löschen"
        cancelText="Abbrechen"
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
}
