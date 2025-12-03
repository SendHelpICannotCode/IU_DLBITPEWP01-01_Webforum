import Link from "next/link";
import { MessageSquare, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950/50 px-4 py-1.5 text-sm text-cyan-400 border border-cyan-800/50">
            <Zap className="h-4 w-4" />
            MVP - Studienprojekt DLBITPEWP01-01
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Willkommen im{" "}
            <span className="text-cyan-400 glow-text">CyberForum</span>
          </h1>

          <p className="text-lg text-slate-400 md:text-xl">
            Ein modernes, schlankes Webforum für strukturierte Diskussionen.
            Registriere dich, erstelle Themen und tausche dich mit der Community
            aus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg">
                <Users className="mr-2 h-5 w-5" />
                Jetzt registrieren
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Zum Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-12">
          Features des Forums
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group hover:border-cyan-800/50 transition-colors">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 group-hover:bg-cyan-900/50 transition-colors">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Themen & Beiträge
              </h3>
              <p className="text-sm text-slate-400">
                Erstelle neue Diskussionsthemen und antworte auf bestehende
                Beiträge. Bearbeite und lösche deine eigenen Inhalte.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:border-cyan-800/50 transition-colors">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 group-hover:bg-cyan-900/50 transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Benutzer-Rollen
              </h3>
              <p className="text-sm text-slate-400">
                Gäste können lesen, registrierte Nutzer schreiben, und
                Administratoren haben volle Moderationsrechte.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:border-cyan-800/50 transition-colors">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 group-hover:bg-cyan-900/50 transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Sicherheit
              </h3>
              <p className="text-sm text-slate-400">
                Sichere Authentifizierung mit Passwort-Hashing,
                Session-Management und Input-Validierung mit Zod.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <Card className="bg-gradient-to-r from-cyan-950/50 to-slate-900/50 border-cyan-800/30">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Bereit loszulegen?
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Werde Teil der Community und starte deine erste Diskussion.
            </p>
            <Link href="/register">
              <Button size="lg" className="glow">
                Kostenlos registrieren
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
