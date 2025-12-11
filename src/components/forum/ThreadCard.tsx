import Link from "next/link";
import { UserRole } from "@prisma/client";
import { MessageSquare, Clock, User } from "lucide-react";
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
    };
    _count: {
      posts: number;
    };
  };
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

export function ThreadCard({ thread }: ThreadCardProps) {
  const isAdmin = thread.author.role === "ADMIN";
  const postCount = thread._count.posts;

  return (
    <Link href={`/forum/thread/${thread.id}`} className="cursor-pointer">
      <Card className="group transition-all hover:border-cyan-800/50 hover:bg-slate-800/50 mb-4">
        <div className="p-5">
          {/* Titel */}
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
            {thread.title}
          </h3>

          {/* Vorschau des Inhalts */}
          <p className="mt-2 text-sm text-slate-400 line-clamp-2">
            {thread.content}
          </p>

          {/* Meta-Informationen */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
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
