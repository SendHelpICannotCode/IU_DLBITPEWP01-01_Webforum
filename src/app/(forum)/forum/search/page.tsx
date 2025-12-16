import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  searchThreads,
  searchPosts,
  searchUsers,
  searchAll,
} from "@/actions/search";
import { searchParamsSchema } from "@/lib/validations";
import { getUserProfile, getUserProfileByUsername } from "@/actions/profile";
import { Card, CardContent, PageSizeSelector } from "@/components/ui";
import {
  SearchResultThread,
  SearchResultPost,
  SearchResultUser,
  SearchTabs,
} from "@/components/search";
import { SearchPagination } from "@/components/search/SearchPagination";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Search, User } from "lucide-react";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    pageSize?: string;
    dateRange?: string;
    categories?: string;
    author?: string;
    authorId?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await getSession();
  const params = await searchParams;

  // Validierung der URL-Parameter
  const parsed = searchParamsSchema.safeParse({
    q: params.q || undefined,
    type: params.type || "all",
    page: params.page,
    pageSize: params.pageSize,
    dateRange: params.dateRange,
    categories: params.categories,
    author: params.author,
    authorId: params.authorId,
  });

  // Wenn Parsing fehlschlägt, zur Startseite
  if (!parsed.success) {
    redirect("/");
  }

  // Wenn keine gültige Query UND keine Filter, zur Startseite
  const hasQuery = parsed.data.q && parsed.data.q.trim().length >= 2;
  const hasFilters =
    parsed.data.author || parsed.data.authorId || parsed.data.categories;

  if (!hasQuery && !hasFilters) {
    redirect("/");
  }

  const {
    q: query = "",
    type,
    page,
    pageSize,
    dateRange,
    categories,
    author,
    authorId,
  } = parsed.data;
  const isAdmin = session.role === "ADMIN";

  // Hole Autor-Informationen, falls gefiltert wird
  let authorName: string | null = null;
  if (author) {
    const authorProfile = await getUserProfileByUsername(author);
    authorName = authorProfile?.username || null;
  } else if (authorId) {
    const authorProfile = await getUserProfile(authorId);
    authorName = authorProfile?.username || null;
  }

  // Filter vorbereiten
  const categoryIds = categories
    ? categories.split(",").filter((id) => id.trim())
    : undefined;
  const filters = {
    dateRange: dateRange as "week" | "month" | "year" | "all" | undefined,
    categoryIds,
    author: author || undefined,
    authorId: authorId || undefined,
  };

  // Suche basierend auf Typ ausführen
  let threadsResult, postsResult, usersResult, allResult;

  if (type === "all") {
    allResult = await searchAll(query, page, pageSize, filters);
    threadsResult = {
      threads: allResult.threads,
      totalCount: allResult.threadsCount,
      totalPages: Math.ceil(allResult.threadsCount / pageSize),
    };
    postsResult = {
      posts: allResult.posts,
      totalCount: allResult.postsCount,
      totalPages: Math.ceil(allResult.postsCount / pageSize),
    };
    usersResult = {
      users: allResult.users,
      totalCount: allResult.usersCount,
      totalPages: Math.ceil(allResult.usersCount / pageSize),
    };
  } else if (type === "threads") {
    const result = await searchThreads(query, page, pageSize, filters);
    threadsResult = {
      threads: result.threads,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  } else if (type === "posts") {
    const result = await searchPosts(query, page, pageSize, filters);
    postsResult = {
      posts: result.posts,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  } else if (type === "users") {
    const result = await searchUsers(query, page, pageSize);
    usersResult = {
      users: result.users,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }

  const hasResults =
    (threadsResult?.totalCount ?? 0) > 0 ||
    (postsResult?.totalCount ?? 0) > 0 ||
    (usersResult?.totalCount ?? 0) > 0;

  return (
    <div className="container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Search className="h-8 w-8 text-cyan-500" />
          Suchergebnisse
        </h1>
        <div className="text-slate-400">
          {query && query.trim().length >= 2 ? (
            <p>Suche nach: &quot;{query}&quot;</p>
          ) : authorName ? (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Threads/Posts von:{" "}
              <span className="text-cyan-400 font-medium">{authorName}</span>
            </p>
          ) : (
            <p>Suche nach: &quot;{query || ""}&quot;</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <SearchTabs currentType={type} />

      {/* Filter */}
      <SearchFilters />

      {/* Ergebnisse basierend auf aktuellem Tab */}
      {type === "all" && (
        <div className="space-y-8">
          {/* Threads */}
          {threadsResult && threadsResult.threads.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Threads ({threadsResult.totalCount})
              </h2>
              <div className="space-y-4">
                {threadsResult.threads.map((thread) => (
                  <SearchResultThread
                    key={thread.id}
                    thread={thread}
                    searchQuery={query}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {postsResult && postsResult.posts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Posts ({postsResult.totalCount})
              </h2>
              <div className="space-y-4">
                {postsResult.posts.map((post) => (
                  <SearchResultPost
                    key={post.id}
                    post={post}
                    searchQuery={query}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Users */}
          {usersResult && usersResult.users.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Autoren ({usersResult.totalCount})
              </h2>
              <div className="space-y-4">
                {usersResult.users.map((user) => (
                  <SearchResultUser
                    key={user.id}
                    user={user}
                    searchQuery={query}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Keine Ergebnisse */}
          {!hasResults && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Keine Ergebnisse gefunden
                </h3>
                <p className="text-slate-400">
                  Versuche es mit anderen Suchbegriffen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {type === "threads" && threadsResult && (
        <div>
          {threadsResult.threads.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {threadsResult.totalCount}{" "}
                  {threadsResult.totalCount === 1 ? "Ergebnis" : "Ergebnisse"}
                </p>
                <PageSizeSelector currentPageSize={pageSize} paramPrefix="" />
              </div>
              <div className="space-y-4 mb-8">
                {threadsResult.threads.map((thread) => (
                  <SearchResultThread
                    key={thread.id}
                    thread={thread}
                    searchQuery={query}
                  />
                ))}
              </div>
              {threadsResult.totalPages > 1 && (
                <div className="mb-8">
                  <SearchPagination
                    currentPage={page}
                    totalPages={threadsResult.totalPages}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Keine Threads gefunden
                </h3>
                <p className="text-slate-400">
                  Versuche es mit anderen Suchbegriffen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {type === "posts" && postsResult && (
        <div>
          {postsResult.posts.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {postsResult.totalCount}{" "}
                  {postsResult.totalCount === 1 ? "Ergebnis" : "Ergebnisse"}
                </p>
                <PageSizeSelector currentPageSize={pageSize} paramPrefix="" />
              </div>
              <div className="space-y-4 mb-8">
                {postsResult.posts.map((post) => (
                  <SearchResultPost
                    key={post.id}
                    post={post}
                    searchQuery={query}
                  />
                ))}
              </div>
              {postsResult.totalPages > 1 && (
                <div className="mb-8">
                  <SearchPagination
                    currentPage={page}
                    totalPages={postsResult.totalPages}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Keine Posts gefunden
                </h3>
                <p className="text-slate-400">
                  Versuche es mit anderen Suchbegriffen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {type === "users" && usersResult && (
        <div>
          {usersResult.users.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {usersResult.totalCount}{" "}
                  {usersResult.totalCount === 1 ? "Ergebnis" : "Ergebnisse"}
                </p>
                <PageSizeSelector currentPageSize={pageSize} paramPrefix="" />
              </div>
              <div className="space-y-4 mb-8">
                {usersResult.users.map((user) => (
                  <SearchResultUser
                    key={user.id}
                    user={user}
                    searchQuery={query}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
              {usersResult.totalPages > 1 && (
                <div className="mb-8">
                  <SearchPagination
                    currentPage={page}
                    totalPages={usersResult.totalPages}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Keine Autoren gefunden
                </h3>
                <p className="text-slate-400">
                  Versuche es mit anderen Suchbegriffen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
