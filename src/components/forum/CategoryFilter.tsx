"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Tag, Check } from "lucide-react";
import { getCategories, searchCategories } from "@/actions/categories";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

/**
 * CategoryFilter - Filterbares Multi-Select Dropdown für Kategorien
 */
export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Category[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lade Kategorien beim Mount
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Lade ausgewählte Kategorien aus URL
  // Synchronisiere State mit URL-Parametern (erforderlich für URL-basierte Filterung)
  useEffect(() => {
    const categoriesParam = searchParams.get("categories");
    const ids = categoriesParam
      ? categoriesParam.split(",").filter((id) => id.trim())
      : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL-Synchronisation erforderlich
    setSelectedCategoryIds(ids);
  }, [searchParams]);

  // Schließe Dropdown beim Klick außerhalb
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Suche mit Debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      // Reset Suchergebnisse wenn Query zu kurz (erforderlich für Debouncing)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchCategories(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Verfügbare Kategorien für Dropdown
  const availableCategories =
    searchQuery.trim().length >= 2 ? searchResults : categories;

  function handleToggleCategory(categoryId: string) {
    const newSelected = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    setSelectedCategoryIds(newSelected);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newSelected.length > 0) {
      params.set("categories", newSelected.join(","));
      params.set("page", "1"); // Reset to page 1 when filtering
    } else {
      params.delete("categories");
      params.delete("page");
    }

    router.push(`/?${params.toString()}`);
  }

  function handleClearAll() {
    setSelectedCategoryIds([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("categories");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  const selectedCategories = categories.filter((cat) =>
    selectedCategoryIds.includes(cat.id)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <Tag className="h-4 w-4" />
        <span>
          {selectedCategoryIds.length > 0
            ? `${selectedCategoryIds.length} Kategorie${selectedCategoryIds.length > 1 ? "n" : ""}`
            : "Kategorien filtern"}
        </span>
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
          {/* Suche */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kategorie suchen..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Ausgewählte Kategorien (wenn vorhanden) */}
          {selectedCategories.length > 0 && (
            <div className="p-3 border-b border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Ausgewählt:
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  Alle entfernen
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                    style={{
                      backgroundColor: category.color
                        ? `${category.color}20`
                        : "rgba(51, 65, 85, 0.3)",
                      borderColor: category.color
                        ? `${category.color}40`
                        : "rgba(51, 65, 85, 0.5)",
                      color: category.color || "#cbd5e1",
                    }}
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(category.id)}
                      className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
                      aria-label={`${category.name} entfernen`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kategorien-Liste */}
          <div className="max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-center text-sm text-slate-400">
                Suche...
              </div>
            ) : availableCategories.length > 0 ? (
              <div className="py-1">
                {availableCategories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleToggleCategory(category.id)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? "bg-cyan-500 border-cyan-500"
                            : "border-slate-600"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="flex-1">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-sm text-slate-400">
                {searchQuery.trim().length >= 2
                  ? "Keine Ergebnisse gefunden"
                  : "Keine Kategorien verfügbar"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
