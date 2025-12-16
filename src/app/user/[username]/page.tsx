import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getUserProfileByUsername,
  getUserStatsByUsername,
} from "@/actions/profile";
import { Card, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { ActivityTimeline } from "@/components/profile/ActivityTimeline";
import { DeleteAccountButton } from "@/components/auth/DeleteAccountButton";
import {
  User,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Edit,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { username } = await params;
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    redirect("/login");
  }

  const [profile, stats] = await Promise.all([
    getUserProfileByUsername(username),
    getUserStatsByUsername(username),
  ]);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = session.userId === profile.id;

  return (
    <div className="container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profil</h1>
        <p className="text-slate-400">
          {isOwnProfile
            ? "Dein Profil und deine Aktivitäten"
            : `Profil von ${profile.username}`}
        </p>
      </div>

      {/* Profil-Header */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {profile.avatarUrl ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800">
                  <Image
                    src={profile.avatarUrl}
                    alt={`${profile.username} Avatar`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                  <span className="text-4xl font-bold text-slate-400">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profil-Informationen */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {profile.username}
                </h2>
                {profile.role === "ADMIN" && (
                  <span className="inline-block px-2 py-1 rounded bg-cyan-900/50 text-cyan-300 text-xs font-medium">
                    Admin
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                {(isOwnProfile || profile.emailPublic) && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Registriert:{" "}
                    {profile.createdAt.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {profile.lastActiveAt && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <User className="h-4 w-4" />
                    <span>
                      Letzte Aktivität:{" "}
                      {profile.lastActiveAt.toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-slate-300 text-sm">{profile.bio}</p>
                </div>
              )}

              {/* Bearbeiten-Button (nur eigenes Profil) */}
              {isOwnProfile && (
                <div className="mt-6">
                  <Link href="/user/edit">
                    <Button variant="primary">
                      <Edit className="mr-2 h-4 w-4" />
                      Profil bearbeiten
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiken */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Threads</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.user._count.threads}
                  </p>
                </div>
                <FileText className="h-12 w-12 text-cyan-500/50" />
              </div>
              {isOwnProfile && stats.user._count.threads > 0 && (
                <Link
                  href={`/forum/search?q=&type=threads&author=${encodeURIComponent(profile.username)}`}
                  className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Meine Threads anzeigen →
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Posts</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.user._count.posts}
                  </p>
                </div>
                <MessageSquare className="h-12 w-12 text-cyan-500/50" />
              </div>
              {isOwnProfile && stats.user._count.posts > 0 && (
                <Link
                  href={`/forum/search?q=&type=posts&author=${encodeURIComponent(profile.username)}`}
                  className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Meine Posts anzeigen →
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aktivitätsverlauf */}
      {stats &&
        (stats.recentThreads.length > 0 || stats.recentPosts.length > 0) && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Letzte Aktivitäten
              </h3>
              <ActivityTimeline
                threads={stats.recentThreads}
                posts={stats.recentPosts}
              />
            </CardContent>
          </Card>
        )}

      {/* Konto löschen (nur eigenes Profil) */}
      {isOwnProfile && (
        <Card className="border-red-900/50 bg-red-950/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Gefährlicher Bereich
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle deine
              Daten werden dauerhaft gelöscht.
            </p>
            <DeleteAccountButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
