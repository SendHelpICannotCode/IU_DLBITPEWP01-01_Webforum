import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Clock, User, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { highlightText } from "./highlightUtils";

interface SearchResultPostProps {
  post: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      role: UserRole;
    };
    thread: {
      id: string;
      title: string;
    };
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

export function SearchResultPost({ post, searchQuery }: SearchResultPostProps) {
  const isAdmin = post.author.role === "ADMIN";

  return (
    <Card className="mb-4">
      <div className="p-6">
        {/* Thread-Kontext */}
        <div className="mb-3 pb-3 border-b border-slate-800/50">
          <Link
            href={`/forum/thread/${post.thread.id}`}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-medium">{post.thread.title}</span>
          </Link>
        </div>

        {/* Post-Inhalt mit Highlighting */}
        <div
          className="mb-4 text-slate-300 line-clamp-3"
          dangerouslySetInnerHTML={{
            __html: highlightText(post.content, searchQuery),
          }}
        />

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
              {post.author.username}
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
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>

          {/* Link zum Post */}
          <Link
            href={`/forum/thread/${post.thread.id}#post-${post.id}`}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Zum Post →
          </Link>
        </div>
      </div>
    </Card>
  );
}
