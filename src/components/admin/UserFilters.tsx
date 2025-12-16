"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input, Button } from "@/components/ui";

/**
 * UserFilters - Client-Komponente für Suche und Filter auf Admin-Users-Seite
 */
export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [role, setRole] = useState<string>(searchParams.get("role") || "all");

  // Debounced Search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim().length >= 2 || search.trim().length === 0) {
        if (search.trim()) {
          params.set("search", search.trim());
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1
        router.push(`/forum/admin/users?${params.toString()}`);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, router, searchParams]);

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }
    params.set("page", "1");
    router.push(`/forum/admin/users?${params.toString()}`);
  }

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    const params = new URLSearchParams(searchParams.toString());
    if (newRole === "all") {
      params.delete("role");
    } else {
      params.set("role", newRole);
    }
    params.set("page", "1");
    router.push(`/forum/admin/users?${params.toString()}`);
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setRole("all");
    router.push("/forum/admin/users");
  }

  const hasActiveFilters =
    search.trim().length >= 2 || status !== "all" || role !== "all";

  return (
    <div className="mb-6 space-y-4">
      {/* Suche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Nach Username oder E-Mail suchen..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status-Filter */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="banned">Gesperrt</option>
        </select>

        {/* Rolle-Filter */}
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">Alle Rollen</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        {/* Filter zurücksetzen - immer sichtbar, disabled wenn keine Filter aktiv */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Zurücksetzen
        </Button>
      </div>

      {/* Aktive Filter anzeigen */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Aktive Filter:
          </span>
          {search.trim().length >= 2 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-900/30 border border-cyan-800 text-cyan-400">
              Suche: &quot;{search}&quot;
            </span>
          )}
          {status !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-900/30 border border-cyan-800 text-cyan-400">
              Status: {status === "active" ? "Aktiv" : "Gesperrt"}
            </span>
          )}
          {role !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-900/30 border border-cyan-800 text-cyan-400">
              Rolle: {role}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
