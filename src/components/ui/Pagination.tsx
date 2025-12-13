"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Smart truncated Pagination-Komponente
 * - Desktop: Zeigt Seitenzahlen mit Ellipsis (z.B. "1 ... 5 6 7 ... 20")
 * - Mobile: Nur Prev/Next Buttons mit "Seite X von Y"
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      // Scroll to top bei Seitenwechsel
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Berechne welche Seitenzahlen angezeigt werden sollen
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      // Bei ≤7 Seiten: Alle anzeigen
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Bei >7 Seiten: Smart truncated
    const pages: (number | "ellipsis")[] = [];

    if (currentPage <= 3) {
      // Am Anfang: 1 2 3 4 ... totalPages
      pages.push(1, 2, 3, 4, "ellipsis", totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Am Ende: 1 ... (totalPages-3) (totalPages-2) (totalPages-1) totalPages
      pages.push(
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      // In der Mitte: 1 ... (current-1) current (current+1) ... totalPages
      pages.push(
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages
      );
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {/* Mobile: Nur Prev/Next */}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Vorherige Seite"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-slate-400">
          Seite {currentPage} von {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Nächste Seite"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop: Vollständige Pagination */}
      <div className="hidden md:flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Vorherige Seite"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-slate-500"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = page === currentPage;

          return (
            <Button
              key={page}
              variant={isCurrentPage ? "primary" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              className={cn(
                isCurrentPage && "bg-cyan-600 hover:bg-cyan-700",
                "min-w-[2.5rem]"
              )}
              aria-label={`Seite ${page}`}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Nächste Seite"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
