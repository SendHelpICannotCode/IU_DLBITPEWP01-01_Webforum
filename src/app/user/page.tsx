import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserProfile } from "@/actions/profile";

export default async function UserPage() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    redirect("/login");
  }

  // Hole Profil, um Username zu bekommen
  const profile = await getUserProfile(session.userId);

  if (!profile) {
    redirect("/login");
  }

  // Redirect zu eigenem Profil (mit Username)
  redirect(`/user/${profile.username}`);
}
