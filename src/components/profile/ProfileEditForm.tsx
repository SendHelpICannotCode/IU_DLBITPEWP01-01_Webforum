"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { updateProfile, type ActionResult } from "@/actions/profile";

interface Profile {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  preferences?: Record<string, unknown> | null;
}

interface ProfileEditFormProps {
  profile: Profile;
  avatarUpload: React.ReactNode;
  changePasswordForm: React.ReactNode;
}

/**
 * ProfileEditForm - Formular zum Bearbeiten des Profils mit Tabs
 */
export function ProfileEditForm({
  profile,
  avatarUpload,
  changePasswordForm,
}: ProfileEditFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "general";

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateProfile.bind(null, profile.id), null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      router.push(`/user/${profile.username}`);
    }
  }, [state?.success, router, profile.username]);

  // Allgemein-Tab
  if (currentTab === "general") {
    return (
      <form action={formAction} className="space-y-6">
        {/* Globaler Fehler */}
        {state?.error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        {/* Username */}
        <div>
          <Input
            type="text"
            name="username"
            label="Benutzername"
            placeholder="z.B. max_mustermann"
            required
            minLength={3}
            maxLength={20}
            defaultValue={profile.username}
            disabled={isPending}
            error={state?.fieldErrors?.username?.[0]}
            aria-invalid={state?.fieldErrors?.username ? "true" : undefined}
          />
        </div>

        {/* E-Mail */}
        <div>
          <Input
            type="email"
            name="email"
            label="E-Mail-Adresse"
            placeholder="max@example.com"
            required
            defaultValue={profile.email}
            disabled={isPending}
            error={state?.fieldErrors?.email?.[0]}
            aria-invalid={state?.fieldErrors?.email ? "true" : undefined}
          />
        </div>

        {/* Bio */}
        <div>
          <Textarea
            name="bio"
            label="Profilbeschreibung (optional)"
            placeholder="Erzähle etwas über dich..."
            rows={4}
            maxLength={500}
            defaultValue={profile.bio || ""}
            disabled={isPending}
            error={state?.fieldErrors?.bio?.[0]}
            aria-invalid={state?.fieldErrors?.bio ? "true" : undefined}
          />
          <p className="mt-1 text-xs text-slate-500">Maximal 500 Zeichen</p>
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
                Änderungen speichern
              </>
            )}
          </Button>
        </div>
      </form>
    );
  }

  // Avatar-Tab
  if (currentTab === "avatar") {
    return <div>{avatarUpload}</div>;
  }

  // Passwort-Tab
  if (currentTab === "password") {
    return <div>{changePasswordForm}</div>;
  }

  // Präferenzen-Tab
  if (currentTab === "preferences") {
    return (
      <div className="space-y-6">
        <p className="text-slate-400 text-sm">
          Präferenzen werden in zukünftigen Versionen verfügbar sein.
        </p>
        {/* Hier könnten später Theme-Auswahl, Benachrichtigungen, etc. hinzugefügt werden */}
      </div>
    );
  }

  return null;
}
