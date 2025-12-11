import { redirect } from "next/navigation";

/**
 * Redirect von /forum zur Startseite
 * Die Thread-Liste ist nun direkt auf der Startseite (/) verfügbar.
 */
export default function ForumPage() {
  redirect("/");
}
