import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewCategoryPage() {
  const session = await getSession();

  // Nur Admins dürfen diese Seite sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="container">
      <div className="mb-8">
        <Link
          href="/forum/admin/categories"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Kategorien-Verwaltung
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Neue Kategorie erstellen
          </h1>
          <p className="text-slate-400">
            Erstelle eine neue Kategorie für das Forum
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kategorie-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm redirectOnSuccess="/forum/admin/categories" />
        </CardContent>
      </Card>
    </div>
  );
}
