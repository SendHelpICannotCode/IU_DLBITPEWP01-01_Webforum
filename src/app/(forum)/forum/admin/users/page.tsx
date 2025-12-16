import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAllUsers } from "@/actions/admin/users";
import { Card, CardContent, PageSizeSelector } from "@/components/ui";
import { UserTable } from "@/components/admin/UserTable";
import { UserFilters } from "@/components/admin/UserFilters";
import { paginationSchema } from "@/lib/validations";
import { Users } from "lucide-react";
import { AdminUsersPagination } from "@/components/admin/AdminUsersPagination";

interface AdminUsersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    role?: string;
  }>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const session = await getSession();

  // Nur Admins dürfen diese Seite sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;

  // Validierung der Pagination-Parameter
  const parsed = paginationSchema.safeParse({
    page: params.page,
    pageSize: params.pageSize,
  });

  const page = parsed.success ? parsed.data.page : 1;
  const pageSize = parsed.success ? parsed.data.pageSize : 15;

  // Filter vorbereiten
  const filters = {
    search: params.search || undefined,
    status:
      params.status === "active" || params.status === "banned"
        ? params.status
        : undefined,
    role:
      params.role === "USER" || params.role === "ADMIN"
        ? (params.role as "USER" | "ADMIN")
        : undefined,
  };

  // Lade Benutzer
  const result = await getAllUsers(page, pageSize, filters);

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-cyan-500" />
          Benutzerverwaltung
        </h1>
        <p className="text-slate-400">
          Verwalte Benutzer, Rollen, Sperren und Löschungen
        </p>
      </div>

      {/* Filter/Suche */}
      <UserFilters />

      {/* Benutzer-Tabelle */}
      {result.error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-400">{result.error}</p>
          </CardContent>
        </Card>
      ) : result.users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Keine Benutzer gefunden
            </h3>
            <p className="text-slate-400">Es wurden keine Benutzer gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {result.totalCount}{" "}
              {result.totalCount === 1 ? "Benutzer" : "Benutzer"} gefunden
            </p>
            <PageSizeSelector currentPageSize={pageSize} paramPrefix="" />
          </div>

          <UserTable users={result.users} currentUserId={session.userId} />

          {result.totalPages > 1 && (
            <div className="mt-6">
              <AdminUsersPagination
                currentPage={page}
                totalPages={result.totalPages}
                pageSize={pageSize}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
