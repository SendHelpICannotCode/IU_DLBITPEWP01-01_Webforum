import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Users, Tag, Lock } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getSession();

  // Nur Admins dürfen diese Seite sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin-Bereich</h1>
        <p className="text-slate-400">
          Verwaltung und Moderation des Forums
        </p>
      </div>

      {/* Dashboard-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Benutzer</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
              <Users className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Kategorien</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
              <Tag className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Gesperrte Threads</p>
                <p className="text-2xl font-bold text-white">-</p>
              </div>
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation zu Unterbereichen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/forum/admin/users">
          <Card className="hover:border-cyan-800/50 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-cyan-500" />
                <CardTitle>Benutzerverwaltung</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Benutzer verwalten, Rollen ändern, sperren oder löschen
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/forum/admin/categories">
          <Card className="hover:border-cyan-800/50 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Tag className="h-6 w-6 text-cyan-500" />
                <CardTitle>Kategorien-Verwaltung</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Kategorien erstellen, bearbeiten und verwalten
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/forum/admin/locked-threads">
          <Card className="hover:border-cyan-800/50 hover:bg-slate-800/50 transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-amber-500" />
                <CardTitle>Gesperrte Threads</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Übersicht aller gesperrten Threads
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
