import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserProfile } from "@/actions/profile";
import { Card, CardContent } from "@/components/ui";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default async function UserEditPage() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.userId);

  if (!profile) {
    // Fallback: Redirect zu Login, wenn Profil nicht gefunden
    redirect("/login");
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Profil bearbeiten
        </h1>
        <p className="text-slate-400">
          Verwalte deine Profilinformationen und Einstellungen
        </p>
      </div>

      {/* Tabs */}
      <ProfileTabs />

      {/* Tab-Inhalte werden in ProfileEditForm gerendert */}
      <Card>
        <CardContent className="p-6">
          <ProfileEditForm
            profile={profile}
            avatarUpload={
              <AvatarUpload
                currentAvatarUrl={profile.avatarUrl}
                userId={profile.id}
                username={profile.username}
              />
            }
            changePasswordForm={<ChangePasswordForm />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
