"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui";

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

/**
 * Client-Wrapper für Pagination
 * Handhabt die URL-Navigation
 */
export function PaginationWrapper({
  currentPage,
  totalPages,
  pageSize,
}: PaginationWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("pageSize", pageSize.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
