"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Trash2,
  Eye,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser,
} from "@/actions/admin/users";
import { UserRole } from "@prisma/client";
import { UserDetailModal } from "./UserDetailModal";
import { ConfirmModal } from "@/components/ui/Modal";
import Link from "next/link";

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  bannedUntil: Date | null;
  banReason: string | null;
  bannedBy: string | null;
  createdAt: Date;
  lastActiveAt: Date | null;
  _count: {
    threads: number;
    posts: number;
  };
}

interface UserTableProps {
  users: User[];
}

/**
 * UserTable - Tabelle für Benutzerverwaltung im Admin-Panel
 */
export function UserTable({ users }: UserTableProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isUnbanModalOpen, setIsUnbanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleViewDetails(userId: string) {
    setSelectedUserId(userId);
    setIsDetailModalOpen(true);
  }

  function handleRoleChange(userId: string, newRole: UserRole) {
    startTransition(async () => {
      setActionError(null);
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        router.refresh();
      } else {
        setActionError(result.error || "Fehler beim Ändern der Rolle");
      }
    });
  }

  function handleBan(userId: string) {
    setSelectedUserId(userId);
    setIsBanModalOpen(true);
  }

  function handleUnban(userId: string) {
    setSelectedUserId(userId);
    setIsUnbanModalOpen(true);
  }

  function handleDelete(userId: string) {
    setSelectedUserId(userId);
    setIsDeleteModalOpen(true);
  }

  function confirmBan() {
    if (!selectedUserId) return;

    startTransition(async () => {
      setActionError(null);
      const result = await banUser(selectedUserId, banReason || undefined);
      if (result.success) {
        setIsBanModalOpen(false);
        setBanReason("");
        router.refresh();
      } else {
        setActionError(result.error || "Fehler beim Sperren");
      }
    });
  }

  function confirmUnban() {
    if (!selectedUserId) return;

    startTransition(async () => {
      setActionError(null);
      const result = await unbanUser(selectedUserId);
      if (result.success) {
        setIsUnbanModalOpen(false);
        router.refresh();
      } else {
        setActionError(result.error || "Fehler beim Entsperren");
      }
    });
  }

  function confirmDelete() {
    if (!selectedUserId) return;

    startTransition(async () => {
      setActionError(null);
      const result = await deleteUser(selectedUserId);
      if (result.success) {
        setIsDeleteModalOpen(false);
        router.refresh();
      } else {
        setActionError(result.error || "Fehler beim Löschen");
      }
    });
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <>
      {/* Fehler-Anzeige */}
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Benutzer
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  E-Mail
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Rolle
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Aktivität
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  Statistiken
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Benutzer */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          user.role === "ADMIN"
                            ? "bg-cyan-900/50 text-cyan-400"
                            : "bg-slate-800 text-slate-400"
                        )}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {user.username}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* E-Mail */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-300">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">
                        {user.email}
                      </span>
                    </div>
                  </td>

                  {/* Rolle */}
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as UserRole)
                      }
                      disabled={isPending}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium border transition-colors",
                        user.role === "ADMIN"
                          ? "bg-cyan-900/30 border-cyan-800 text-cyan-400"
                          : "bg-slate-800 border-slate-700 text-slate-300",
                        "hover:bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {user.isBanned ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 border border-red-800 text-red-400">
                          <Ban className="h-3 w-3" />
                          Gesperrt
                        </span>
                        {user.bannedUntil && (
                          <span className="text-xs text-slate-500">
                            Bis:{" "}
                            {user.bannedUntil.toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {user.banReason && (
                          <span className="text-xs text-slate-500 truncate max-w-[150px]">
                            {user.banReason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 border border-green-800 text-green-400">
                        <UserCheck className="h-3 w-3" />
                        Aktiv
                      </span>
                    )}
                  </td>

                  {/* Aktivität */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {user.createdAt.toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {user.lastActiveAt && (
                        <div className="text-slate-500">
                          Aktiv:{" "}
                          {user.lastActiveAt.toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Statistiken */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <Link
                        href={`/forum/search?q=&type=threads&author=${encodeURIComponent(user.username)}`}
                        className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {user._count.threads}
                      </Link>
                      <Link
                        href={`/forum/search?q=&type=posts&author=${encodeURIComponent(user.username)}`}
                        className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {user._count.posts}
                      </Link>
                    </div>
                  </td>

                  {/* Aktionen */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user.id)}
                        title="Details anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user.isBanned ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnban(user.id)}
                          disabled={isPending}
                          title="Entsperren"
                        >
                          <UserCheck className="h-4 w-4 text-green-400" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBan(user.id)}
                          disabled={isPending}
                          title="Sperren"
                        >
                          <Ban className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={isPending}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail-Modal */}
      {selectedUser && (
        <UserDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUser.id}
        />
      )}

      {/* Ban-Modal */}
      <ConfirmModal
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setBanReason("");
          setSelectedUserId(null);
        }}
        onConfirm={confirmBan}
        title="Benutzer sperren"
        message={
          <div className="space-y-3">
            <p>Möchtest du diesen Benutzer wirklich sperren?</p>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Grund (optional):
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Grund für die Sperre..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                maxLength={500}
              />
            </div>
          </div>
        }
        confirmText="Sperren"
        cancelText="Abbrechen"
        isLoading={isPending}
        variant="danger"
      />

      {/* Unban-Modal */}
      <ConfirmModal
        isOpen={isUnbanModalOpen}
        onClose={() => {
          setIsUnbanModalOpen(false);
          setSelectedUserId(null);
        }}
        onConfirm={confirmUnban}
        title="Benutzer entsperren"
        message="Möchtest du die Sperre für diesen Benutzer wirklich aufheben?"
        confirmText="Entsperren"
        cancelText="Abbrechen"
        isLoading={isPending}
        variant="warning"
      />

      {/* Delete-Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUserId(null);
        }}
        onConfirm={confirmDelete}
        title="Benutzer löschen"
        message="Diese Aktion kann nicht rückgängig gemacht werden. Alle Threads und Posts des Benutzers werden ebenfalls gelöscht."
        confirmText="Löschen"
        cancelText="Abbrechen"
        isLoading={isPending}
        variant="danger"
      />
    </>
  );
}
