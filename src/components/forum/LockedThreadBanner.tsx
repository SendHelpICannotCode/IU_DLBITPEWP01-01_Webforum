import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockedThreadBannerProps {
  className?: string;
}

/**
 * LockedThreadBanner - Banner für gesperrte Threads
 */
export function LockedThreadBanner({ className }: LockedThreadBannerProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-amber-900/30 border border-amber-800/50 p-4 flex items-center gap-3",
        className
      )}
    >
      <Lock className="h-5 w-5 text-amber-400 shrink-0" />
      <p className="text-sm text-amber-300">
        Dieser Thread ist gesperrt. Nur Administratoren können diesen Thread
        bearbeiten.
      </p>
    </div>
  );
}
