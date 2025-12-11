import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { checkDatabaseConnection } from "@/lib/db";
import { Card, CardHeader, CardContent, Button } from "@/components/ui";
import { LoginForm } from "@/components/auth";

export default async function LoginPage() {
  const dbConnected = await checkDatabaseConnection();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Anmelden</h1>
          <p className="text-center text-slate-400 mt-2">
            Willkommen zurück! Melde dich an, um fortzufahren.
          </p>
        </CardHeader>

        <CardContent>
          {dbConnected ? (
            <LoginForm />
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Datenbank nicht erreichbar
              </h3>
              <p className="text-slate-400 mb-4">
                Die Verbindung zur Datenbank konnte nicht hergestellt werden.
              </p>
              <Link href="/">
                <Button variant="outline">Zurück zur Startseite</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
