"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { register, ActionResult } from "@/actions/auth";
import { Button, Input } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(register, null);

  return (
    <>
      <form action={formAction} className="space-y-4">
        {/* Allgemeiner Fehler */}
        {state?.error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.error}
          </div>
        )}

        {/* Benutzername */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Benutzername
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="dein_username"
            required
            autoComplete="username"
            minLength={3}
            maxLength={20}
            disabled={isPending}
          />
          {state?.fieldErrors?.username && (
            <p className="mt-1 text-sm text-red-400">
              {state.fieldErrors.username[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            3-20 Zeichen, nur Buchstaben, Zahlen und Unterstriche
          </p>
        </div>

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
            autoComplete="new-password"
            minLength={8}
            disabled={isPending}
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-sm text-red-400">
              {state.fieldErrors.password[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">Mindestens 8 Zeichen</p>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird registriert...
            </>
          ) : (
            "Registrieren"
          )}
        </Button>
      </form>

      {/* Link zum Login */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Bereits ein Konto?{" "}
        <Link
          href="/login"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Jetzt anmelden
        </Link>
      </p>
    </>
  );
}
