"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { login, ActionResult } from "@/actions/auth";
import { Button, Input } from "@/components/ui";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(login, null);

  return (
    <>
      <form action={formAction} className="space-y-4">
        {/* Allgemeiner Fehler */}
        {state?.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.error}
          </div>
        )}

        {/* E-Mail */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            E-Mail
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="deine@email.de"
            required
            autoComplete="email"
            disabled={isPending}
          />
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-400">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        {/* Passwort */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Passwort
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={isPending}
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-sm text-red-400">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird angemeldet...
            </>
          ) : (
            "Anmelden"
          )}
        </Button>
      </form>

      {/* Link zur Registrierung */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Jetzt registrieren
        </Link>
      </p>
    </>
  );
}
