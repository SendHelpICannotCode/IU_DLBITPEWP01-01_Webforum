"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface PageSizeSelectorProps {
  currentPageSize: number;
  className?: string;
  paramPrefix?: string; // Für Posts: "postsPage" / "postsPageSize", für Threads: "page" / "pageSize"
}

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50] as const;

/**
 * PageSizeSelector-Komponente
 * Ermöglicht es dem Benutzer, die Anzahl der Einträge pro Seite zu ändern
 */
export function PageSizeSelector({
  currentPageSize,
  className,
  paramPrefix = "", // Standard: "page" / "pageSize"
}: PageSizeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = paramPrefix ? `${paramPrefix}Page` : "page";
  const pageSizeParam = paramPrefix ? `${paramPrefix}PageSize` : "pageSize";

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageSizeParam, newPageSize.toString());
    // Bei Seitengrößen-Änderung auf Seite 1 zurückgehen
    params.set(pageParam, "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-slate-400">Anzeigen:</span>
      <div className="flex items-center gap-1">
        {PAGE_SIZE_OPTIONS.map((size) => (
          <Button
            key={size}
            variant={currentPageSize === size ? "primary" : "outline"}
            size="sm"
            onClick={() => handlePageSizeChange(size)}
            className={cn(
              currentPageSize === size && "bg-cyan-600 hover:bg-cyan-700",
              "min-w-[3rem]"
            )}
            aria-label={`${size} Einträge pro Seite`}
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
}
