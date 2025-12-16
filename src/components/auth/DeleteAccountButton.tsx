"use client";

import { useState, useActionState, useEffect } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { deleteAccount, type ActionResult } from "@/actions/auth";
import { Modal } from "@/components/ui/Modal";

/**
 * DeleteAccountButton - Button zum Löschen des eigenen Kontos (DSGVO)
 */
export function DeleteAccountButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(deleteAccount, null);

  function handleOpen() {
    setIsModalOpen(true);
    setPassword("");
    setConfirmDelete(false);
  }

  function handleClose() {
    if (!isPending) {
      setIsModalOpen(false);
      setPassword("");
      setConfirmDelete(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("confirmDelete", confirmDelete ? "true" : "false");
    formAction(formData);
  }

  // Modal schließen bei Erfolg (wird zu Startseite weitergeleitet)
  useEffect(() => {
    if (state?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Erfolgsbehandlung erforderlich
      setIsModalOpen(false);
    }
  }, [state?.success]);

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={handleOpen}
        disabled={isPending}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Konto löschen
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Konto wirklich löschen?"
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium mb-2">
                  Diese Aktion kann{" "}
                  <strong>nicht rückgängig gemacht werden</strong>.
                </p>
                <p className="text-slate-400 mb-2">
                  Alle deine Daten werden dauerhaft gelöscht:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
                  <li>Dein Benutzerkonto</li>
                  <li>Alle deine Threads</li>
                  <li>Alle deine Posts</li>
                  <li>Dein Avatar (falls vorhanden)</li>
                </ul>
              </div>
            </div>

            {/* Passwort-Eingabe */}
            <div>
              <Input
                type="password"
                name="password"
                label="Passwort zur Bestätigung"
                placeholder="Gib dein Passwort ein"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                error={state?.error}
                aria-invalid={state?.error ? "true" : undefined}
              />
            </div>

            {/* Checkbox zur Bestätigung */}
            <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg">
              <input
                type="checkbox"
                id="confirm-delete"
                name="confirmDelete"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                disabled={isPending}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900 cursor-pointer"
                required
              />
              <label
                htmlFor="confirm-delete"
                className="text-sm text-slate-300 cursor-pointer"
              >
                Ich verstehe, dass diese Aktion nicht rückgängig gemacht werden
                kann und alle meine Daten dauerhaft gelöscht werden.
              </label>
            </div>
          </div>

          {/* Fehler-Anzeige */}
          {state?.error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
              {state.error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isPending || !confirmDelete || !password}
              isLoading={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Konto endgültig löschen
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
