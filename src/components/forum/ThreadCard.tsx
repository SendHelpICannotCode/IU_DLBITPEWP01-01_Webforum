"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { MessageSquare, Clock, Ban, UserX } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      role: UserRole;
      avatarUrl: string | null;
      isBanned: boolean;
      isDeleted: boolean;
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
  currentUserId?: string;
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

  // Für ältere Daten das normale Datum anzeigen
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function CategoryBadge({
  category,
  onClick,
}: {
  category: { id: string; name: string; color?: string | null };
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border hover:opacity-80 transition-opacity cursor-pointer"
      style={{
        backgroundColor: category.color
          ? `${category.color}20`
          : "rgba(51, 65, 85, 0.3)",
        borderColor: category.color
          ? `${category.color}40`
          : "rgba(51, 65, 85, 0.5)",
        color: category.color || "#cbd5e1",
      }}
      aria-label={`Nach ${category.name} filtern`}
    >
      {category.name}
    </button>
  );
}

export function ThreadCard({ thread, currentUserId }: ThreadCardProps) {
  const router = useRouter();
  const isAdmin = thread.author.role === "ADMIN";
  const isOwnThread = currentUserId === thread.author.id;
  const postCount = thread._count.posts;

  function handleCategoryClick(e: React.MouseEvent, categoryId: string) {
    e.preventDefault();
    e.stopPropagation();
    // Navigiere zur Startseite mit Kategorie-Filter
    router.push(`/?categories=${categoryId}&page=1`);
  }

  return (
    <Link href={`/forum/thread/${thread.id}`} className="cursor-pointer">
      <Card className="group transition-all hover:border-cyan-800/50 hover:bg-slate-800/50 mb-4">
        <div className="p-6">
          {/* Titel */}
          <h3 className="text-xl font-semibold text-white group-hover:text-[var(--accent-hover)] transition-colors line-clamp-1 mb-2">
            {thread.title}
          </h3>

          {/* Kategorie-Badges - Direkt nach Titel für bessere Sichtbarkeit */}
          {thread.categories && thread.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {thread.categories.slice(0, 4).map(({ category }) => (
                <CategoryBadge
                  key={category.id}
                  category={category}
                  onClick={(e) => handleCategoryClick(e, category.id)}
                />
              ))}
              {thread.categories.length > 4 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/50 border border-slate-700 text-slate-400">
                  +{thread.categories.length - 4} weitere
                </span>
              )}
            </div>
          )}

          {/* Vorschau des Inhalts */}
          <p className="mb-4 text-sm text-slate-400 line-clamp-2">
            {thread.content}
          </p>

          {/* Meta-Informationen */}
          <div className="pt-3 border-t border-slate-800/50 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {/* Autor */}
            <div className="flex items-center gap-1.5">
              {thread.author.avatarUrl &&
              !thread.author.isBanned &&
              !thread.author.isDeleted ? (
                <div className="relative h-5 w-5 rounded-full overflow-hidden border border-slate-700">
                  <Image
                    src={thread.author.avatarUrl}
                    alt={`${thread.author.username} Avatar`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : thread.author.isDeleted ? (
                <div className="h-5 w-5 rounded-full flex items-center justify-center bg-red-900/50 text-red-400">
                  <UserX className="h-3 w-3" />
                </div>
              ) : thread.author.isBanned ? (
                <div className="h-5 w-5 rounded-full flex items-center justify-center bg-amber-900/50 text-amber-400">
                  <Ban className="h-3 w-3" />
                </div>
              ) : (
                <div
                  className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                    isAdmin
                      ? "bg-cyan-900/50 text-cyan-400"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                  {thread.author.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isAdmin &&
                    !thread.author.isBanned &&
                    !thread.author.isDeleted &&
                    "text-cyan-400",
                  (thread.author.isBanned || thread.author.isDeleted) &&
                    "text-slate-500 italic",
                  !isAdmin &&
                    !thread.author.isBanned &&
                    !thread.author.isDeleted &&
                    "text-white",
                  "truncate max-w-[120px]"
                )}
              >
                {thread.author.isDeleted
                  ? "gelöschter Nutzer"
                  : thread.author.isBanned
                    ? "gesperrter Nutzer"
                    : thread.author.username}
              </span>
              {isAdmin &&
                !thread.author.isBanned &&
                !thread.author.isDeleted && (
                  <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[10px] text-cyan-300">
                    Admin
                  </span>
                )}
              {isOwnThread && (
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  Du
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
