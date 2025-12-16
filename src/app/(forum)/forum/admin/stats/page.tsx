import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getForumStats } from "@/actions/admin/stats";
import { Card, CardContent } from "@/components/ui";
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Ban,
  Tag,
  Lock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/components/profile/utils";

export default async function AdminStatsPage() {
  const session = await getSession();

  // Nur Admins dürfen diese Seite sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/");
  }

  const stats = await getForumStats();

  if (!stats) {
    return (
      <div className="container">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Keine Berechtigung</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mb-8">
        <Link
          href="/forum/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Admin-Bereich
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-cyan-500" />
          Forum-Statistiken
        </h1>
        <p className="text-slate-400">
          Detaillierte Übersicht über Forum-Aktivitäten
        </p>
      </div>

      {/* Übersichts-Karten - Gleiche Basis-Metriken wie Hauptseite */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Benutzer</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Threads</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalThreads}
                </p>
              </div>
              <FileText className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Posts</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalPosts}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Kategorien</p>
                <p className="text-2xl font-bold text-white">
                  {stats.categoryDistribution.length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Gesperrte Threads</p>
                <p className="text-2xl font-bold text-white">
                  {stats.lockedThreadCount}
                </p>
              </div>
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Gesperrte Benutzer
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.bannedUsers}
                </p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktivste Benutzer */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Aktivste Benutzer (Top 10)
            </h3>
            <div className="space-y-2">
              {stats.topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-6">
                      #{index + 1}
                    </span>
                    <Link
                      href={`/user/${user.username}`}
                      className="text-sm font-medium text-white hover:text-cyan-400 transition-colors"
                    >
                      {user.username}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {user._count.threads}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {user._count.posts}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kategorien-Verteilung */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Kategorien-Verteilung
            </h3>
            <div className="space-y-2">
              {stats.categoryDistribution
                .sort((a, b) => b.threadCount - a.threadCount)
                .map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="text-sm text-white">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {category.threadCount}{" "}
                      {category.threadCount === 1 ? "Thread" : "Threads"}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Neueste Threads */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Neueste Threads
            </h3>
            <div className="space-y-2">
              {stats.recentThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/thread/${thread.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="text-sm font-medium text-white line-clamp-1">
                    {thread.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    von {thread.author.username} •{" "}
                    {formatRelativeTime(new Date(thread.createdAt))} •{" "}
                    {thread._count.posts}{" "}
                    {thread._count.posts === 1 ? "Antwort" : "Antworten"}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Neueste Posts */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Neueste Posts
            </h3>
            <div className="space-y-2">
              {stats.recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/thread/${post.thread.id}#post-${post.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="text-sm font-medium text-white line-clamp-1">
                    {post.thread.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {post.content}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    von {post.author.username} •{" "}
                    {formatRelativeTime(new Date(post.createdAt))}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
