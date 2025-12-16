"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { changePassword, type ActionResult } from "@/actions/auth";

/**
 * ChangePasswordForm - Formular zum Ändern des Passworts
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(changePassword, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      // Erfolgsmeldung anzeigen (könnte auch ein Toast sein)
      alert("Passwort erfolgreich geändert!");
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Globaler Fehler */}
      {state?.error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Altes Passwort */}
      <div>
        <Input
          type="password"
          name="oldPassword"
          label="Aktuelles Passwort"
          placeholder="Gib dein aktuelles Passwort ein"
          required
          disabled={isPending}
          error={state?.fieldErrors?.oldPassword?.[0]}
          aria-invalid={state?.fieldErrors?.oldPassword ? "true" : undefined}
        />
      </div>

      {/* Neues Passwort */}
      <div>
        <Input
          type="password"
          name="newPassword"
          label="Neues Passwort"
          placeholder="Mindestens 8 Zeichen"
          required
          minLength={8}
          maxLength={100}
          disabled={isPending}
          error={state?.fieldErrors?.newPassword?.[0]}
          aria-invalid={state?.fieldErrors?.newPassword ? "true" : undefined}
        />
      </div>

      {/* Passwort bestätigen */}
      <div>
        <Input
          type="password"
          name="confirmPassword"
          label="Neues Passwort bestätigen"
          placeholder="Gib das neue Passwort erneut ein"
          required
          minLength={8}
          maxLength={100}
          disabled={isPending}
          error={state?.fieldErrors?.confirmPassword?.[0]}
          aria-invalid={
            state?.fieldErrors?.confirmPassword ? "true" : undefined
          }
        />
      </div>

      {/* Submit-Button */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gespeichert...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Passwort ändern
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
