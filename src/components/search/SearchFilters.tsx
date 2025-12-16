"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Tag, User, X } from "lucide-react";
import { Button } from "@/components/ui";
import { getCategories } from "@/actions/categories";
import { searchUsers } from "@/actions/search";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface User {
  id: string;
  username: string;
}

/**
 * SearchFilters - Erweiterte Filter für die Suche
 */
export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<string>("all");
  const [authorSearch, setAuthorSearch] = useState("");
  const [authorResults, setAuthorResults] = useState<User[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [selectedAuthorName, setSelectedAuthorName] = useState<string | null>(
    null
  );

  // Lade Kategorien
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Lade Filter aus URL
  useEffect(() => {
    const categoriesParam = searchParams.get("categories");
    const dateRangeParam = searchParams.get("dateRange");
    const authorIdParam = searchParams.get("authorId");

    if (categoriesParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL-Synchronisation erforderlich
      setSelectedCategoryIds(categoriesParam.split(",").filter((id) => id));
    }
    if (dateRangeParam) {
      setDateRange(dateRangeParam);
    }
    if (authorIdParam) {
      setSelectedAuthorId(authorIdParam);
      // Autor-Name aus Cache oder später laden
    }
  }, [searchParams]);

  // Suche nach Autoren mit Debouncing
  useEffect(() => {
    if (authorSearch.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset erforderlich für Debouncing
      setAuthorResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const result = await searchUsers(authorSearch.trim(), 1, 5);
      setAuthorResults(result.users);
    }, 300);

    return () => clearTimeout(timeout);
  }, [authorSearch]);

  function updateFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset to page 1

    if (dateRange && dateRange !== "all") {
      params.set("dateRange", dateRange);
    } else {
      params.delete("dateRange");
    }

    if (selectedCategoryIds.length > 0) {
      params.set("categories", selectedCategoryIds.join(","));
    } else {
      params.delete("categories");
    }

    if (selectedAuthorId) {
      params.set("authorId", selectedAuthorId);
    } else {
      params.delete("authorId");
    }

    router.push(`/forum/search?${params.toString()}`);
  }

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  function handleAuthorSelect(user: User) {
    setSelectedAuthorId(user.id);
    setSelectedAuthorName(user.username);
    setAuthorSearch("");
    setAuthorResults([]);
  }

  function handleRemoveAuthor() {
    setSelectedAuthorId(null);
    setSelectedAuthorName(null);
  }

  const hasActiveFilters =
    dateRange !== "all" ||
    selectedCategoryIds.length > 0 ||
    selectedAuthorId !== null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <span>Erweiterte Filter</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
              Aktiv
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setDateRange("all");
              setSelectedCategoryIds([]);
              setSelectedAuthorId(null);
              setSelectedAuthorName(null);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("dateRange");
              params.delete("categories");
              params.delete("authorId");
              params.set("page", "1");
              router.push(`/forum/search?${params.toString()}`);
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
          {/* Datumsbereich */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Calendar className="h-4 w-4" />
              Zeitraum
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Alle Zeit</option>
              <option value="week">Letzte Woche</option>
              <option value="month">Letzter Monat</option>
              <option value="year">Letztes Jahr</option>
            </select>
          </div>

          {/* Kategorien */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Tag className="h-4 w-4" />
              Kategorien
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    selectedCategoryIds.includes(category.id)
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                  style={{
                    borderColor: selectedCategoryIds.includes(category.id)
                      ? category.color || undefined
                      : undefined,
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Autor */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <User className="h-4 w-4" />
              Autor
            </label>
            {selectedAuthorId ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white flex-1">
                  {selectedAuthorName}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveAuthor}
                  className="p-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Autor entfernen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={authorSearch}
                  onChange={(e) => setAuthorSearch(e.target.value)}
                  placeholder="Autor suchen..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {authorResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {authorResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAuthorSelect(user)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {user.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Anwenden-Button */}
          <div className="pt-2 border-t border-slate-700">
            <Button
              type="button"
              onClick={updateFilters}
              className="w-full"
              variant="primary"
            >
              Filter anwenden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
