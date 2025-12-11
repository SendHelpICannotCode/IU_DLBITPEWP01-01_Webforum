import Link from "next/link";
import { MessageSquare, Github, ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-slate-800 bg-slate-900/50">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Branding */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-white cursor-pointer"
            >
              <MessageSquare className="h-5 w-5 text-cyan-500" />
              CyberForum
            </Link>
            <p className="text-sm text-slate-400 max-w-xs">
              Ein modernes Webforum entwickelt als MVP im Rahmen des
              IU-Studienprojekts &quot;Einstieg in die Web-Programmierung&quot;.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Rechtliches</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/impressum"
                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Datenschutzerklärung
              </Link>
            </nav>
          </div>

          {/* Tech Stack */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Technologien</h4>
            <div className="flex flex-wrap gap-2">
              {["Next.js", "React", "TypeScript", "Tailwind", "Prisma"].map(
                (tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {currentYear} CyberForum. Erstellt für das IU-Modul
            DLBITPEWP01-01.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
              aria-label="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
              aria-label="Next.js Dokumentation"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
