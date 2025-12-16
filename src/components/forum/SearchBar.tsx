"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  FileText,
  MessageSquare,
  User,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui";
import { getSearchSuggestions } from "@/actions/search";
import { highlightText } from "@/components/search";

/**
 * SearchBar - Immer sichtbare Suchleiste im Header mit Vorschlägen
 */
export function SearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    threads: Array<{ id: string; title: string }>;
    posts: Array<{
      id: string;
      content: string;
      thread: { id: string; title: string };
    }>;
    users: Array<{ id: string; username: string }>;
  }>({ threads: [], posts: [], users: [] });
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

  // Suche mit Debouncing (300ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset erforderlich für Debouncing
      setSuggestions({ threads: [], posts: [], users: [] });
      setIsSearching(false);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await getSearchSuggestions(searchQuery.trim(), 3);
      setSuggestions(results);
      setIsSearching(false);
      setIsDropdownOpen(true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length >= 2) {
      setIsDropdownOpen(false);
      router.push(
        `/forum/search?q=${encodeURIComponent(trimmedQuery)}&type=all`
      );
    }
  }

  function handleShowAllResults() {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length >= 2) {
      setIsDropdownOpen(false);
      router.push(
        `/forum/search?q=${encodeURIComponent(trimmedQuery)}&type=all`
      );
    }
  }

  function handleClear() {
    setSearchQuery("");
    setSuggestions({ threads: [], posts: [], users: [] });
    setIsDropdownOpen(false);
  }

  function handleSuggestionClick() {
    setIsDropdownOpen(false);
  }

  const hasSuggestions =
    suggestions.threads.length > 0 ||
    suggestions.posts.length > 0 ||
    suggestions.users.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 max-w-2xl mx-4 hidden md:flex items-center"
    >
      <div className="relative w-full" ref={dropdownRef}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setIsDropdownOpen(true);
            }
          }}
          onFocus={() => {
            if (searchQuery.trim().length >= 2 && hasSuggestions) {
              setIsDropdownOpen(true);
            }
          }}
          placeholder="Suche nach Threads, Posts, Autoren..."
          className="pl-10 pr-10 w-full"
          minLength={2}
          maxLength={100}
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer z-10"
            aria-label="Suche leeren"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown mit Vorschlägen */}
        {isDropdownOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Suche...</span>
              </div>
            ) : hasSuggestions ? (
              <div className="py-2">
                {/* Threads */}
                {suggestions.threads.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                      Threads
                    </div>
                    {suggestions.threads.map((thread) => (
                      <Link
                        key={thread.id}
                        href={`/forum/thread/${thread.id}`}
                        onClick={handleSuggestionClick}
                        className="block px-4 py-2 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                          <span
                            className="text-sm text-slate-200 line-clamp-1"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(thread.title, searchQuery),
                            }}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Posts */}
                {suggestions.posts.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                      Posts
                    </div>
                    {suggestions.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/forum/thread/${post.thread.id}#post-${post.id}`}
                        onClick={handleSuggestionClick}
                        className="block px-4 py-2 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-400 mb-1 line-clamp-1">
                              {post.thread.title}
                            </div>
                            <span
                              className="text-sm text-slate-200 line-clamp-1"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(
                                  post.content,
                                  searchQuery
                                ),
                              }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Users */}
                {suggestions.users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                      Autoren
                    </div>
                    {suggestions.users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/forum/search?q=${encodeURIComponent(user.username)}&type=users`}
                        onClick={handleSuggestionClick}
                        className="block px-4 py-2 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-cyan-500 shrink-0" />
                          <span
                            className="text-sm text-slate-200"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(user.username, searchQuery),
                            }}
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* "Alle Ergebnisse anzeigen" Link */}
                <div className="border-t border-slate-700 mt-2">
                  <button
                    type="button"
                    onClick={handleShowAllResults}
                    className="w-full px-4 py-2 text-sm text-cyan-400 hover:bg-slate-700 transition-colors cursor-pointer text-left"
                  >
                    Alle Ergebnisse anzeigen →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-slate-400 text-center">
                Keine Vorschläge gefunden
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
