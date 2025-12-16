"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  User,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Shield,
  Ban,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Card, CardContent } from "@/components/ui";
import { getUser, getUserActivity } from "@/actions/admin/users";
import Link from "next/link";
import { formatRelativeTime } from "@/components/profile/utils";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  emailPublic: boolean;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  isBanned: boolean;
  bannedUntil: Date | null;
  banReason: string | null;
  createdAt: Date;
  lastActiveAt: Date | null;
  _count: {
    threads: number;
    posts: number;
  };
}

interface ActivityData {
  threads: Array<{
    id: string;
    title: string;
    createdAt: Date;
    _count: { posts: number };
  }>;
  posts: Array<{
    id: string;
    content: string;
    createdAt: Date;
    thread: {
      id: string;
      title: string;
    };
  }>;
}

/**
 * UserDetailModal - Modal mit detaillierten Benutzer-Informationen
 */
export function UserDetailModal({
  isOpen,
  onClose,
  userId,
}: UserDetailModalProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      // Reset beim Schließen
      setUser(null);
      setActivity(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Lade Daten asynchron
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [userResult, activityResult] = await Promise.all([
          getUser(userId),
          getUserActivity(userId),
        ]);

        if (cancelled) return;

        if (userResult.error) {
          setError(userResult.error);
        } else if (userResult.user) {
          setUser(userResult.user);
        }

        if (activityResult.error) {
          setError(activityResult.error);
        } else {
          setActivity(activityResult);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Fehler beim Laden der Benutzer-Details:", err);
        setError("Fehler beim Laden der Daten");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Benutzer-Details"
      className="max-w-3xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
          {error}
        </div>
      ) : user ? (
        <div className="space-y-6">
          {/* Profil-Informationen */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium ${
                    user.role === "ADMIN"
                      ? "bg-cyan-900/50 text-cyan-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {user.username}
                    </h3>
                    {user.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-900/50 text-cyan-300">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                    {user.isBanned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400">
                        <Ban className="h-3 w-3" />
                        Gesperrt
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>
                        {user.emailPublic ? (
                          user.email
                        ) : (
                          <span className="text-slate-500 italic">
                            Nicht öffentlich
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Registriert:{" "}
                        {user.createdAt.toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {user.lastActiveAt && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Letzte Aktivität:{" "}
                          {formatRelativeTime(new Date(user.lastActiveAt))}
                        </span>
                      </div>
                    )}
                    {user.isBanned && user.banReason && (
                      <div className="mt-2 p-2 rounded bg-red-900/20 border border-red-800/50">
                        <p className="text-xs text-red-400">
                          <strong>Sperr-Grund:</strong> {user.banReason}
                        </p>
                        {user.bannedUntil && (
                          <p className="text-xs text-red-400 mt-1">
                            <strong>Gesperrt bis:</strong>{" "}
                            {user.bannedUntil.toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiken */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Threads</p>
                    <p className="text-2xl font-bold text-white">
                      {user._count.threads}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-cyan-500/50" />
                </div>
                {user._count.threads > 0 && (
                  <Link
                    href={`/forum/search?q=&type=threads&author=${encodeURIComponent(user.username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Threads anzeigen →
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Posts</p>
                    <p className="text-2xl font-bold text-white">
                      {user._count.posts}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-cyan-500/50" />
                </div>
                {user._count.posts > 0 && (
                  <Link
                    href={`/forum/search?q=&type=posts&author=${encodeURIComponent(user.username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Posts anzeigen →
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aktivitätsverlauf */}
          {activity &&
            (activity.threads.length > 0 || activity.posts.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Letzte Aktivitäten
                  </h4>
                  <div className="space-y-3">
                    {activity.threads.slice(0, 5).map((thread) => (
                      <div
                        key={thread.id}
                        className="flex items-start gap-3 p-2 rounded bg-slate-800/50"
                      >
                        <FileText className="h-4 w-4 text-cyan-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/forum/thread/${thread.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-white hover:text-cyan-400 transition-colors line-clamp-1"
                          >
                            {thread.title}
                          </Link>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatRelativeTime(new Date(thread.createdAt))} •{" "}
                            {thread._count.posts}{" "}
                            {thread._count.posts === 1
                              ? "Antwort"
                              : "Antworten"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activity.posts.slice(0, 5).map((post) => (
                      <div
                        key={post.id}
                        className="flex items-start gap-3 p-2 rounded bg-slate-800/50"
                      >
                        <MessageSquare className="h-4 w-4 text-cyan-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/forum/thread/${post.thread.id}#post-${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-white hover:text-cyan-400 transition-colors line-clamp-1"
                          >
                            {post.thread.title}
                          </Link>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {post.content}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatRelativeTime(new Date(post.createdAt))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      ) : null}
    </Modal>
  );
}
