import Link from "next/link";
import { UserRole } from "@prisma/client";
import { MessageSquare, Clock, User } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { highlightText } from "./highlightUtils";

interface SearchResultThreadProps {
  thread: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      role: UserRole;
    };
    _count: {
      posts: number;
    };
    categories?: {
      category: {
        id: string;
        name: string;
        color?: string | null;
      };
    }[];
  };
  searchQuery: string;
}

/**
 * Formatiert ein Datum relativ zur aktuellen Zeit
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "gerade eben";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `vor ${diffInMinutes} ${diffInMinutes === 1 ? "Minute" : "Minuten"}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `vor ${diffInHours} ${diffInHours === 1 ? "Stunde" : "Stunden"}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `vor ${diffInDays} ${diffInDays === 1 ? "Tag" : "Tagen"}`;
  }

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function SearchResultThread({
  thread,
  searchQuery,
}: SearchResultThreadProps) {
  const isAdmin = thread.author.role === "ADMIN";
  const postCount = thread._count.posts;

  return (
    <Link href={`/forum/thread/${thread.id}`} className="cursor-pointer">
      <Card className="group transition-all hover:border-cyan-800/50 hover:bg-slate-800/50 mb-4">
        <div className="p-6">
          {/* Titel mit Highlighting */}
          <h3
            className="text-xl font-semibold text-white group-hover:text-(--accent-hover) transition-colors line-clamp-1 mb-2"
            dangerouslySetInnerHTML={{
              __html: highlightText(thread.title, searchQuery),
            }}
          />

          {/* Vorschau des Inhalts mit Highlighting */}
          <p
            className="mb-4 text-sm text-slate-400 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: highlightText(thread.content, searchQuery),
            }}
          />

          {/* Kategorie-Badges */}
          {thread.categories && thread.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {thread.categories.slice(0, 4).map(({ category }) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
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
                </span>
              ))}
              {thread.categories.length > 4 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/50 border border-slate-700 text-slate-400">
                  +{thread.categories.length - 4} weitere
                </span>
              )}
            </div>
          )}

          {/* Meta-Informationen */}
          <div className="pt-3 border-t border-slate-800/50 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {/* Autor */}
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span
                className={cn(
                  isAdmin && "text-cyan-400 font-medium",
                  "truncate max-w-[120px]"
                )}
              >
                {thread.author.username}
              </span>
              {isAdmin && (
                <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[10px] text-cyan-300">
                  Admin
                </span>
              )}
            </div>

            {/* Datum */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeTime(thread.createdAt)}</span>
            </div>

            {/* Antworten */}
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>
                {postCount} {postCount === 1 ? "Antwort" : "Antworten"}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
