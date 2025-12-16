import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLockedThreads } from "@/actions/threads";
import { Card, CardContent } from "@/components/ui";
import { ThreadCard, PaginationWrapper } from "@/components/forum";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { paginationSchema } from "@/lib/validations";

interface LockedThreadsPageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

export default async function LockedThreadsPage({
  searchParams,
}: LockedThreadsPageProps) {
  const session = await getSession();

  // Nur Admins dürfen diese Seite sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;

  // Validierung der URL-Parameter
  const parsed = paginationSchema.safeParse({
    page: params.page,
    pageSize: params.pageSize,
  });

  const page = parsed.success ? parsed.data.page : 1;
  const pageSize = parsed.success ? parsed.data.pageSize : 15;

  const { threads, totalCount, totalPages } = await getLockedThreads(
    page,
    pageSize
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Lock className="h-8 w-8 text-amber-500" />
              Gesperrte Threads
            </h1>
            <p className="text-slate-400">
              {totalCount}{" "}
              {totalCount === 1 ? "Thread gesperrt" : "Threads gesperrt"}
            </p>
          </div>
        </div>
      </div>

      {/* Thread-Liste */}
      {threads.length > 0 ? (
        <>
          <div className="space-y-6 mb-8">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUserId={session.userId}
              />
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mb-8">
              <PaginationWrapper
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
              />
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Keine gesperrten Threads
            </h3>
            <p className="text-slate-400">
              Aktuell sind keine Threads gesperrt.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
