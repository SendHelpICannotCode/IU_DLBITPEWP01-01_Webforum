import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  User,
  Users,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { getThread } from "@/actions/threads";
import { Card, CardContent, Button } from "@/components/ui";
import { PostCard, PostForm, ThreadContent } from "@/components/forum";
import { cn } from "@/lib/utils";

interface ThreadPageProps {
  params: Promise<{ id: string }>;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const [session, { thread, dbError }] = await Promise.all([
    getSession(),
    getThread(id),
  ]);

  // Bei DB-Fehler: Fehlermeldung anzeigen
  if (dbError) {
    return (
      <div className="container pt-8 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>

        <Card className="border-amber-500/50">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Datenbank nicht erreichbar
            </h3>
            <p className="text-slate-400 mb-4">
              Die Verbindung zur Datenbank konnte nicht hergestellt werden.
            </p>
            <Link href="/">
              <Button variant="outline">Zurück zur Startseite</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!thread) {
    notFound();
  }

  const isAdmin = thread.author.role === "ADMIN";
  const isOwnThread = session.userId === thread.author.id;
  const canModerate = isOwnThread || session.role === "ADMIN";

  return (
    <div className="container pt-8 pb-16">
      {/* Zurück-Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </Link>

      {/* Thread Header */}
      <Card className="mb-6">
        <div className="p-6">
          {/* Meta-Informationen */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4 pb-4 border-b border-slate-800">
            {/* Autor */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  isAdmin
                    ? "bg-cyan-900/50 text-cyan-400"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {thread.author.username.charAt(0).toUpperCase()}
              </div>
              <span
                className={cn(
                  "font-medium",
                  isAdmin ? "text-cyan-400" : "text-white"
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

            {/* Antworten */}
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>
                {thread.posts.length}{" "}
                {thread.posts.length === 1 ? "Antwort" : "Antworten"}
              </span>
            </div>
          </div>

          {/* Thread-Inhalt mit Versionierung */}
          <ThreadContent
            threadId={thread.id}
            title={thread.title}
            content={thread.content}
            currentVersion={thread.currentVersion}
            createdAt={thread.createdAt}
            updatedAt={thread.updatedAt}
            canModerate={canModerate}
          />
        </div>
      </Card>

      {/* Antworten */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-500" />
          Antworten ({thread.posts.length})
        </h2>

        {thread.posts.length > 0 ? (
          <div className="space-y-6 mb-8">
            {thread.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={session.userId}
                currentUserRole={session.role}
              />
            ))}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <p className="text-slate-400">
                Noch keine Antworten vorhanden. Sei der Erste!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Antwort-Formular */}
      {session.isLoggedIn ? (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Schreibe eine Antwort
            </h3>
            <PostForm threadId={thread.id} />
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-400 mb-4">
              Melde dich an, um auf dieses Thema zu antworten.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <Button>
                  <User className="mr-2 h-4 w-4" />
                  Anmelden
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Registrieren
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
