"use client";

import { useActionState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import { createPost, type ActionResult } from "@/actions/posts";

interface PostFormProps {
  threadId: string;
}

export function PostForm({ threadId }: PostFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(createPost, null);

  // Formular zurücksetzen nach erfolgreichem Submit
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {/* Hidden Thread ID */}
      <input type="hidden" name="threadId" value={threadId} />

      {/* Globaler Fehler */}
      {state?.error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Erfolgs-Feedback */}
      {state?.success && (
        <div className="rounded-lg bg-green-900/30 border border-green-800 p-3 text-sm text-green-400">
          Deine Antwort wurde veröffentlicht!
        </div>
      )}

      {/* Inhalt */}
      <div>
        <Textarea
          name="content"
          placeholder="Schreibe eine Antwort..."
          rows={4}
          required
          minLength={1}
          maxLength={5000}
          disabled={isPending}
          aria-invalid={state?.fieldErrors?.content ? "true" : undefined}
        />
        {state?.fieldErrors?.content && (
          <p className="mt-1 text-sm text-red-400">
            {state.fieldErrors.content[0]}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Antworten
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
