"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { Card } from "@/components/ui";
import { DeletePostButton } from "@/components/forum/DeletePostButton";
import { PostCardContent } from "@/components/forum/PostCardContent";
import { PostEditor } from "@/components/forum/PostEditor";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    currentVersion: number;
    author: {
      id: string;
      username: string;
      role: UserRole;
    };
  };
  currentUserId?: string;
  currentUserRole?: UserRole;
}

export function PostCard({
  post,
  currentUserId,
  currentUserRole,
}: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = post.author.role === "ADMIN";
  const isOwnPost = currentUserId === post.author.id;
  const canModerate = isOwnPost || currentUserRole === "ADMIN";

  return (
    <Card
      className={cn(
        "transition-colors",
        isOwnPost && "border-cyan-900/50 bg-cyan-950/20"
      )}
    >
      <div className="p-5">
        {/* Header mit Autor */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {/* Avatar Placeholder */}
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                isAdmin
                  ? "bg-cyan-900/50 text-cyan-400"
                  : "bg-slate-800 text-slate-400"
              )}
            >
              {post.author.username.charAt(0).toUpperCase()}
            </div>

            {/* Username */}
            <span
              className={cn(
                "font-medium",
                isAdmin ? "text-cyan-400" : "text-white"
              )}
            >
              {post.author.username}
            </span>

            {/* Admin Badge */}
            {isAdmin && (
              <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[10px] text-cyan-300">
                Admin
              </span>
            )}

            {/* Own Post Indicator */}
            {isOwnPost && (
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                Du
              </span>
            )}
          </div>
        </div>

        {/* Inhalt mit Versionierung */}
        <PostCardContent
          postId={post.id}
          content={post.content}
          currentVersion={post.currentVersion}
          createdAt={post.createdAt}
          updatedAt={post.updatedAt}
        />

        {/* Aktionen (nur wenn berechtigt) */}
        {isEditing ? (
          <PostEditor
            postId={post.id}
            currentContent={post.content}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          canModerate && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Bearbeiten
              </button>
              <DeletePostButton postId={post.id} />
            </div>
          )
        )}
      </div>
    </Card>
  );
}
