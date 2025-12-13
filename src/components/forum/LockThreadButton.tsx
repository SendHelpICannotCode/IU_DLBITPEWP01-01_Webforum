"use client";

import { useState, useTransition } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui";
import { lockThread, unlockThread, type ActionResult } from "@/actions/threads";
import { useRouter } from "next/navigation";

interface LockThreadButtonProps {
  threadId: string;
  isLocked: boolean;
}

/**
 * LockThreadButton - Button zum Sperren/Entsperren von Threads (nur Admin)
 */
export function LockThreadButton({
  threadId,
  isLocked,
}: LockThreadButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = isLocked
        ? await unlockThread(threadId)
        : await lockThread(threadId);

      if (!result.success) {
        setError(result.error || "Ein Fehler ist aufgetreten");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
        className="cursor-pointer"
        aria-label={isLocked ? "Thread entsperren" : "Thread sperren"}
      >
        {isPending ? (
          "Wird verarbeitet..."
        ) : isLocked ? (
          <>
            <Unlock className="mr-2 h-4 w-4" />
            Entsperren
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Sperren
          </>
        )}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
