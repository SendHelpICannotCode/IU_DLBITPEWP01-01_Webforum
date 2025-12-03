import { getSession } from "@/lib/session";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { MessageSquare } from "lucide-react";

export default async function ForumPage() {
  const session = await getSession();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Forum</h1>
        <p className="text-slate-400">
          Willkommen im Forum
          {session.isLoggedIn && (
            <span className="text-cyan-400">, {session.username}</span>
          )}
          ! Hier werden bald die Threads angezeigt.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-cyan-500" />
            <h2 className="text-xl font-semibold">Thread-Übersicht</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">
            Die Forum-Funktionalität wird in Sprint 3 implementiert.
          </p>
          {session.isLoggedIn ? (
            <p className="mt-4 text-sm text-green-400">
              ✓ Du bist eingeloggt als{" "}
              <span className="font-medium">{session.username}</span>
              {session.role === "ADMIN" && (
                <span className="ml-2 rounded bg-cyan-900/50 px-2 py-0.5 text-xs text-cyan-300">
                  Admin
                </span>
              )}
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Melde dich an, um Threads zu erstellen und zu kommentieren.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
