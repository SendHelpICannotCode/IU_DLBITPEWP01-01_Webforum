"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { searchCategories } from "@/actions/categories";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface CategoryTagsInputProps {
  selectedCategories: Category[];
  availableCategories: Category[];
  onChange: (categories: Category[]) => void;
  disabled?: boolean;
}

/**
 * CategoryTagsInput - Filterbares Tags-Input für Kategorien
 */
export function CategoryTagsInput({
  selectedCategories,
  availableCategories,
  onChange,
  disabled = false,
}: CategoryTagsInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Category[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Verfügbare Kategorien für Dropdown (nicht bereits ausgewählt)
  const availableForSelection = availableCategories.filter(
    (cat) => !selectedCategories.some((selected) => selected.id === cat.id)
  );

  // Zeige Suchergebnisse oder verfügbare Kategorien
  const dropdownCategories =
    searchQuery.trim().length >= 2
      ? searchResults.filter(
          (cat) => !selectedCategories.some((selected) => selected.id === cat.id)
        )
      : availableForSelection;

  function handleAddCategory(category: Category) {
    if (!selectedCategories.some((cat) => cat.id === category.id)) {
      onChange([...selectedCategories, category]);
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
  }

  function handleRemoveCategory(categoryId: string) {
    onChange(selectedCategories.filter((cat) => cat.id !== categoryId));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Kategorien
      </label>

      {/* Ausgewählte Kategorien als Badges */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCategories.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border"
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
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(category.id)}
                  className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
                  aria-label={`${category.name} entfernen`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Dropdown mit Suche */}
      {!disabled && (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Kategorie suchen oder auswählen..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Dropdown-Liste */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-sm text-slate-400">
                  Suche...
                </div>
              ) : dropdownCategories.length > 0 ? (
                <div className="py-1">
                  {dropdownCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleAddCategory(category)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-sm text-slate-400">
                  {searchQuery.trim().length >= 2
                    ? "Keine Ergebnisse gefunden"
                    : "Keine weiteren Kategorien verfügbar"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hidden Input für FormData */}
      <input
        type="hidden"
        name="categoryIds"
        value={selectedCategories.map((cat) => cat.id).join(",")}
      />
    </div>
  );
}
