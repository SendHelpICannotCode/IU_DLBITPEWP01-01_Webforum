import { UserRole } from "@prisma/client";
import { Mail, MessageSquare, FileText, Calendar } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { highlightText } from "./highlightUtils";

interface SearchResultUserProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    _count: {
      threads: number;
      posts: number;
    };
  };
  searchQuery: string;
  isAdmin?: boolean;
}

export function SearchResultUser({
  user,
  searchQuery,
  isAdmin = false,
}: SearchResultUserProps) {
  const isUserAdmin = user.role === "ADMIN";

  return (
    <Card className="mb-4">
      <div className="p-6">
        {/* Header mit Username */}
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar */}
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium",
              isUserAdmin
                ? "bg-cyan-900/50 text-cyan-400"
                : "bg-slate-800 text-slate-400"
            )}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>

          {/* Username mit Highlighting */}
          <div className="flex-1">
            <h3
              className="text-lg font-semibold text-white"
              dangerouslySetInnerHTML={{
                __html: highlightText(user.username, searchQuery),
              }}
            />
            {isUserAdmin && (
              <span className="inline-block mt-1 rounded bg-cyan-900/50 px-1.5 py-0.5 text-[10px] text-cyan-300">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* E-Mail (nur für Admins) */}
        {isAdmin && (
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>
        )}

        {/* Statistiken */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <FileText className="h-4 w-4" />
            <span>
              {user._count.threads}{" "}
              {user._count.threads === 1 ? "Thread" : "Threads"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MessageSquare className="h-4 w-4" />
            <span>
              {user._count.posts} {user._count.posts === 1 ? "Post" : "Posts"}
            </span>
          </div>
        </div>

        {/* Registrierungsdatum */}
        <div className="pt-3 border-t border-slate-800/50 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Registriert:{" "}
            {user.createdAt.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </Card>
  );
}
