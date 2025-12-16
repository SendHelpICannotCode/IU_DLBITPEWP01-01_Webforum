"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchTabsProps {
  currentType: "threads" | "posts" | "users" | "all";
}

export function SearchTabs({ currentType }: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleTabChange(type: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    params.set("page", "1"); // Reset to page 1 when switching tabs
    router.push(`/forum/search?${params.toString()}`);
  }

  const tabs = [
    { id: "all", label: "Alle" },
    { id: "threads", label: "Threads" },
    { id: "posts", label: "Posts" },
    { id: "users", label: "Autoren" },
  ];

  return (
    <div className="mb-6 border-b border-slate-800">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = currentType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                isActive
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
