"use server";

import { prisma, checkDatabaseConnection } from "@/lib/db";

/**
 * Berechnet das Startdatum basierend auf dem Datumsbereich
 */
function getDateRangeStart(
  dateRange?: "week" | "month" | "year" | "all"
): Date | undefined {
  if (!dateRange || dateRange === "all") {
    return undefined;
  }

  const now = new Date();
  const start = new Date();

  switch (dateRange) {
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  return start;
}

/**
 * Rückgabetyp für Thread-Suche
 */
export type SearchThreadsResult = {
  threads: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      role: string;
    };
    _count: {
      posts: number;
    };
    categories: Array<{
      category: {
        id: string;
        name: string;
        color?: string | null;
      };
    }>;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  dbError: boolean;
};

/**
 * Sucht Threads nach Titel und Inhalt (mit optionalen Filtern)
 */
export async function searchThreads(
  query: string,
  page: number = 1,
  pageSize: number = 15,
  filters?: {
    dateRange?: "week" | "month" | "year" | "all";
    categoryIds?: string[];
    author?: string; // Username (primär)
    authorId?: string; // ID (Fallback)
  }
): Promise<SearchThreadsResult> {
  const dbConnected = await checkDatabaseConnection();

  // Wenn keine DB-Verbindung oder weder Query noch Filter vorhanden
  const hasQuery = query && query.trim().length >= 2;
  const hasFilters =
    filters?.author ||
    filters?.authorId ||
    (filters?.categoryIds && filters.categoryIds.length > 0) ||
    filters?.dateRange;

  if (!dbConnected || (!hasQuery && !hasFilters)) {
    return {
      threads: [],
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
      dbError: !dbConnected,
    };
  }

  const searchTerm = hasQuery ? query.trim() : "";
  const validPage = Math.max(1, page);
  const validPageSize = [10, 15, 20, 50].includes(pageSize) ? pageSize : 15;
  const skip = (validPage - 1) * validPageSize;

  // Datumsbereich-Filter
  const dateStart = getDateRangeStart(filters?.dateRange);
  const dateFilter = dateStart
    ? {
        createdAt: {
          gte: dateStart,
        },
      }
    : undefined;

  // Kategorie-Filter
  const categoryFilter =
    filters?.categoryIds && filters.categoryIds.length > 0
      ? {
          categories: {
            some: {
              categoryId: {
                in: filters.categoryIds,
              },
            },
          },
        }
      : undefined;

  // Autor-Filter (Username hat Priorität, sonst ID)
  const authorFilter = filters?.author
    ? {
        author: {
          username: filters.author,
        },
      }
    : filters?.authorId
      ? {
          authorId: filters.authorId,
        }
      : undefined;

  // Query-Filter (nur wenn Query vorhanden)
  // Sucht in Titel, Inhalt UND Autor-Username
  const queryFilter = hasQuery
    ? {
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
          {
            content: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
          {
            author: {
              username: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : undefined;

  // Kombiniere alle Filter
  const whereClause = {
    AND: [
      ...(queryFilter ? [queryFilter] : []),
      ...(dateFilter ? [dateFilter] : []),
      ...(categoryFilter ? [categoryFilter] : []),
      ...(authorFilter ? [authorFilter] : []),
    ],
  };

  const [threads, totalCount] = await Promise.all([
    prisma.thread.findMany({
      where: whereClause,
      skip,
      take: validPageSize,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        _count: {
          select: { posts: true },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    }),
    prisma.thread.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const finalPage = Math.min(validPage, totalPages);

  const finalThreads =
    finalPage !== validPage
      ? await prisma.thread.findMany({
          where: whereClause,
          skip: (finalPage - 1) * validPageSize,
          take: validPageSize,
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
            _count: {
              select: { posts: true },
            },
            categories: {
              include: {
                category: true,
              },
            },
          },
        })
      : threads;

  return {
    threads: finalThreads,
    totalCount,
    page: finalPage,
    pageSize: validPageSize,
    totalPages,
    dbError: false,
  };
}

/**
 * Rückgabetyp für Post-Suche
 */
export type SearchPostsResult = {
  posts: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      username: string;
      role: string;
    };
    thread: {
      id: string;
      title: string;
    };
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  dbError: boolean;
};

/**
 * Sucht Posts nach Inhalt (mit optionalen Filtern)
 */
export async function searchPosts(
  query: string,
  page: number = 1,
  pageSize: number = 15,
  filters?: {
    dateRange?: "week" | "month" | "year" | "all";
    categoryIds?: string[];
    author?: string; // Username (primär)
    authorId?: string; // ID (Fallback)
  }
): Promise<SearchPostsResult> {
  const dbConnected = await checkDatabaseConnection();

  // Wenn keine DB-Verbindung oder weder Query noch Filter vorhanden
  const hasQuery = query && query.trim().length >= 2;
  const hasFilters =
    filters?.author ||
    filters?.authorId ||
    (filters?.categoryIds && filters.categoryIds.length > 0) ||
    filters?.dateRange;

  if (!dbConnected || (!hasQuery && !hasFilters)) {
    return {
      posts: [],
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
      dbError: !dbConnected,
    };
  }

  const searchTerm = hasQuery ? query.trim() : "";
  const validPage = Math.max(1, page);
  const validPageSize = [10, 15, 20, 50].includes(pageSize) ? pageSize : 15;
  const skip = (validPage - 1) * validPageSize;

  // Datumsbereich-Filter
  const dateStart = getDateRangeStart(filters?.dateRange);
  const dateFilter = dateStart
    ? {
        createdAt: {
          gte: dateStart,
        },
      }
    : undefined;

  // Kategorie-Filter (über Thread)
  const categoryFilter =
    filters?.categoryIds && filters.categoryIds.length > 0
      ? {
          thread: {
            categories: {
              some: {
                categoryId: {
                  in: filters.categoryIds,
                },
              },
            },
          },
        }
      : undefined;

  // Autor-Filter (Username hat Priorität, sonst ID)
  const authorFilter = filters?.author
    ? {
        author: {
          username: filters.author,
        },
      }
    : filters?.authorId
      ? {
          authorId: filters.authorId,
        }
      : undefined;

  // Query-Filter (nur wenn Query vorhanden)
  // Sucht in Inhalt UND Autor-Username
  const queryFilter = hasQuery
    ? {
        OR: [
          {
            content: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
          {
            author: {
              username: {
                contains: searchTerm,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : undefined;

  // Kombiniere alle Filter
  const whereClause = {
    AND: [
      ...(queryFilter ? [queryFilter] : []),
      ...(dateFilter ? [dateFilter] : []),
      ...(categoryFilter ? [categoryFilter] : []),
      ...(authorFilter ? [authorFilter] : []),
    ],
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: whereClause,
      skip,
      take: validPageSize,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.post.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const finalPage = Math.min(validPage, totalPages);

  const finalPosts =
    finalPage !== validPage
      ? await prisma.post.findMany({
          where: whereClause,
          skip: (finalPage - 1) * validPageSize,
          take: validPageSize,
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
            thread: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        })
      : posts;

  return {
    posts: finalPosts,
    totalCount,
    page: finalPage,
    pageSize: validPageSize,
    totalPages,
    dbError: false,
  };
}

/**
 * Rückgabetyp für User-Suche
 */
export type SearchUsersResult = {
  users: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: Date;
    _count: {
      threads: number;
      posts: number;
    };
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  dbError: boolean;
};

/**
 * Sucht Benutzer nach Username (mit optionalen Filtern)
 */
export async function searchUsers(
  query: string,
  page: number = 1,
  pageSize: number = 15,
  filters?: {
    author?: string; // Username (primär)
    authorId?: string; // ID (Fallback)
  }
): Promise<SearchUsersResult> {
  const dbConnected = await checkDatabaseConnection();

  // Prüfe ob Query vorhanden ODER author-Filter vorhanden
  const hasQuery = query && query.trim().length >= 2;
  const hasAuthorFilter = filters?.author || filters?.authorId;

  if (!dbConnected || (!hasQuery && !hasAuthorFilter)) {
    return {
      users: [],
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
      dbError: !dbConnected,
    };
  }

  const searchTerm = hasQuery ? query.trim() : "";
  const validPage = Math.max(1, page);
  const validPageSize = [10, 15, 20, 50].includes(pageSize) ? pageSize : 15;
  const skip = (validPage - 1) * validPageSize;

  // Wenn author-Filter vorhanden, suche nach exaktem Username oder ID
  // Sonst suche nach Query im Username
  const whereClause = hasAuthorFilter
    ? filters?.author
      ? {
          username: filters.author,
        }
      : {
          id: filters?.authorId,
        }
    : {
        username: {
          contains: searchTerm,
          mode: "insensitive" as const,
        },
      };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: validPageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            posts: true,
          },
        },
      },
    }),
    prisma.user.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const finalPage = Math.min(validPage, totalPages);

  const finalUsers =
    finalPage !== validPage
      ? await prisma.user.findMany({
          where: whereClause,
          skip: (finalPage - 1) * validPageSize,
          take: validPageSize,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                threads: true,
                posts: true,
              },
            },
          },
        })
      : users;

  return {
    users: finalUsers,
    totalCount,
    page: finalPage,
    pageSize: validPageSize,
    totalPages,
    dbError: false,
  };
}

/**
 * Rückgabetyp für kombinierte Suche
 */
export type SearchAllResult = {
  threads: SearchThreadsResult["threads"];
  posts: SearchPostsResult["posts"];
  users: SearchUsersResult["users"];
  threadsCount: number;
  postsCount: number;
  usersCount: number;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  dbError: boolean;
};

/**
 * Kombinierte Suche über Threads, Posts und Users (mit optionalen Filtern)
 * Jeder Typ wird separat paginiert (jeweils page/pageSize)
 */
export async function searchAll(
  query: string,
  page: number = 1,
  pageSize: number = 15,
  filters?: {
    dateRange?: "week" | "month" | "year" | "all";
    categoryIds?: string[];
    author?: string; // Username (primär)
    authorId?: string; // ID (Fallback)
  }
): Promise<SearchAllResult> {
  const dbConnected = await checkDatabaseConnection();

  // Prüfe ob Query vorhanden ODER Filter vorhanden
  const hasQuery = query && query.trim().length >= 2;
  const hasFilters =
    filters?.author ||
    filters?.authorId ||
    (filters?.categoryIds && filters.categoryIds.length > 0) ||
    filters?.dateRange;

  if (!dbConnected || (!hasQuery && !hasFilters)) {
    return {
      threads: [],
      posts: [],
      users: [],
      threadsCount: 0,
      postsCount: 0,
      usersCount: 0,
      totalCount: 0,
      page: 1,
      pageSize: 15,
      totalPages: 0,
      dbError: !dbConnected,
    };
  }

  // Parallel alle Suchen ausführen (mit Filtern)
  // Wenn kein Query vorhanden, aber author-Filter, dann leeren Query verwenden
  const searchQuery = hasQuery ? query : "";
  const [threadsResult, postsResult, usersResult] = await Promise.all([
    searchThreads(searchQuery, page, pageSize, filters),
    searchPosts(searchQuery, page, pageSize, filters),
    searchUsers(searchQuery, page, pageSize, filters), // Users bekommen jetzt auch Filter
  ]);

  const totalCount =
    threadsResult.totalCount + postsResult.totalCount + usersResult.totalCount;

  // Gesamtseitenzahl basierend auf allen Ergebnissen
  const totalPages = Math.max(
    threadsResult.totalPages,
    postsResult.totalPages,
    usersResult.totalPages
  );

  return {
    threads: threadsResult.threads,
    posts: postsResult.posts,
    users: usersResult.users,
    threadsCount: threadsResult.totalCount,
    postsCount: postsResult.totalCount,
    usersCount: usersResult.totalCount,
    totalCount,
    page,
    pageSize,
    totalPages,
    dbError: false,
  };
}

/**
 * Rückgabetyp für Such-Vorschläge
 */
export type SearchSuggestionsResult = {
  threads: Array<{
    id: string;
    title: string;
  }>;
  posts: Array<{
    id: string;
    content: string;
    thread: {
      id: string;
      title: string;
    };
  }>;
  users: Array<{
    id: string;
    username: string;
  }>;
};

/**
 * Schnelle Such-Vorschläge für Autocomplete (limitierte Anzahl pro Typ)
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 3
): Promise<SearchSuggestionsResult> {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected || !query || query.trim().length < 2) {
    return {
      threads: [],
      posts: [],
      users: [],
    };
  }

  const searchTerm = query.trim();

  // Parallel alle Suchen ausführen (limitierte Anzahl für Vorschläge)
  const [threads, posts, users] = await Promise.all([
    prisma.thread.findMany({
      where: {
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
          {
            content: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.post.findMany({
      where: {
        content: {
          contains: searchTerm,
          mode: "insensitive" as const,
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        username: {
          contains: searchTerm,
          mode: "insensitive" as const,
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
      },
    }),
  ]);

  return {
    threads,
    posts,
    users,
  };
}
