"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProfileTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "general";

  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/user/edit?${params.toString()}`);
  }

  const tabs = [
    { id: "general", label: "Allgemein" },
    { id: "avatar", label: "Avatar" },
    { id: "password", label: "Passwort" },
    { id: "preferences", label: "Präferenzen" },
  ];

  return (
    <div className="mb-6 border-b border-slate-800">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
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
