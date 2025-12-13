import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCategories } from "@/actions/categories";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminCategoriesPage() {
  const session = await getSession();

  // Nur Admins dürfen diese Seite sehen
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/");
  }

  const categories = await getCategories();

  return (
    <div className="container">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Kategorien-Verwaltung
          </h1>
          <p className="text-slate-400">
            Verwalte die Kategorien des Forums
          </p>
        </div>
        <Link href="/forum/admin/categories/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Neue Kategorie
          </Button>
        </Link>
      </div>

      {/* Kategorien-Tabelle */}
      {categories.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alle Kategorien ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                      Beschreibung
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                      Farbe
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                      Schlagwörter
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {category.color && (
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <span className="font-medium text-white">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {category.description || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {category.color ? (
                          <code className="text-xs text-slate-400">
                            {category.color}
                          </code>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {category.keywords && category.keywords.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {category.keywords.slice(0, 3).map((keyword, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                              >
                                {keyword}
                              </span>
                            ))}
                            {category.keywords.length > 3 && (
                              <span className="text-xs text-slate-500">
                                +{category.keywords.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/forum/admin/categories/${category.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Bearbeiten
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400 mb-4">
              Noch keine Kategorien vorhanden.
            </p>
            <Link href="/forum/admin/categories/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Erste Kategorie erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
