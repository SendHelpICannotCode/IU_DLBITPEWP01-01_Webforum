import Link from "next/link";
import { AlertTriangle, MessageSquare, PlusCircle, Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { getThreads } from "@/actions/threads";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  PageSizeSelector,
} from "@/components/ui";
import { ThreadCard, ThreadForm, PaginationWrapper } from "@/components/forum";
import { paginationSchema } from "@/lib/validations";

interface HomePageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  // Validierung der URL-Parameter
  const parsed = paginationSchema.safeParse({
    page: params.page,
    pageSize: params.pageSize,
  });

  const page = parsed.success ? parsed.data.page : 1;
  const pageSize = parsed.success ? parsed.data.pageSize : 15;

  const [session, { threads, totalCount, totalPages, dbError }] =
    await Promise.all([getSession(), getThreads(page, pageSize)]);

  return (
    <div className="container">
      {/* Header-Bereich */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Forum</h1>
          <p className="text-slate-400 flex flex-wrap items-center gap-2">
            {dbError ? (
              <span className="text-amber-500">Offline</span>
            ) : (
              <span>
                {totalCount} {totalCount === 1 ? "Diskussion" : "Diskussionen"}
                {totalPages > 1 && (
                  <>
                    {" "}
                    <span className="text-slate-600">•</span> Seite {page} von{" "}
                    {totalPages}
                  </>
                )}
              </span>
            )}
            {session.isLoggedIn && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400 font-medium">
                  {session.username}
                </span>
                {session.role === "ADMIN" && (
                  <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[11px] text-cyan-300">
                    Admin
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Neues Thema Button (nur eingeloggt und wenn DB erreichbar) */}
        {session.isLoggedIn && !dbError && (
          <Link href="#new-thread">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Thema
            </Button>
          </Link>
        )}
      </div>

      {/* PageSizeSelector (nur wenn DB erreichbar und Threads vorhanden) */}
      {!dbError && totalCount > 0 && (
        <div className="mb-4 flex justify-end">
          <PageSizeSelector
            currentPageSize={pageSize}
            paramPrefix=""
          />
        </div>
      )}

      {/* Thread-Liste */}
      {dbError ? (
        <Card className="mb-12 border-amber-500/50">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Datenbank nicht erreichbar
            </h3>
            <p className="text-slate-400 mb-4">
              Die Verbindung zur Datenbank konnte nicht hergestellt werden.
            </p>
          </CardContent>
        </Card>
      ) : threads.length > 0 ? (
        <>
          <div className="space-y-6 mb-8">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mb-12">
              <PaginationWrapper
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
              />
            </div>
          )}
        </>
      ) : (
        <Card className="mb-12">
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Noch keine Themen vorhanden
            </h3>
            <p className="text-slate-400 mb-4">
              Sei der Erste und starte eine Diskussion!
            </p>
            {!session.isLoggedIn && (
              <Link href="/login">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Anmelden um zu schreiben
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Neues Thema Formular (nur eingeloggt und wenn DB erreichbar) */}
      {!dbError &&
        (session.isLoggedIn ? (
          <Card id="new-thread">
            <CardHeader>
              <div className="flex items-center gap-3">
                <PlusCircle className="h-6 w-6 text-cyan-500" />
                <h2 className="text-xl font-semibold">Neues Thema erstellen</h2>
              </div>
            </CardHeader>
            <CardContent>
              <ThreadForm />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-slate-400 mb-4">
                Melde dich an, um Themen zu erstellen und zu kommentieren.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/login">
                  <Button>Anmelden</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">Registrieren</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
