"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui";

interface PostsPaginationWrapperProps {
  threadId: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

/**
 * Client-Wrapper für Post-Pagination
 * Handhabt die URL-Navigation für Posts innerhalb eines Threads
 */
export function PostsPaginationWrapper({
  threadId,
  currentPage,
  totalPages,
  pageSize,
}: PostsPaginationWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("postsPage", newPage.toString());
    params.set("postsPageSize", pageSize.toString());
    router.push(`/forum/thread/${threadId}?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
