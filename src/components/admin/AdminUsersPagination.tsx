"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui";

interface AdminUsersPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

/**
 * Client-Wrapper für Pagination auf Admin-Users-Seite
 * Handhabt die URL-Navigation
 */
export function AdminUsersPagination({
  currentPage,
  totalPages,
  pageSize,
}: AdminUsersPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("pageSize", pageSize.toString());
    router.push(`/forum/admin/users?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
