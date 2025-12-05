export default function DatenschutzPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Datenschutz&shy;erklärung
          </h1>
          <p className="text-slate-400">
            Hinweise zum Datenschutz für das Studienprojekt „CyberForum“.
          </p>
        </div>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Verantwortliche Stelle
          </h2>
          <p className="text-slate-300">
            CyberForum (Studienprojekt) <br />
            E-Mail: datenschutz@cyberforum.local
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Erhobene Daten
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Login-Daten (E-Mail, Passwort-Hash)</li>
            <li>Profildaten (Username)</li>
            <li>Forenbeiträge (Threads, Posts, Versionen)</li>
            <li>Technische Protokolle (Server-Logs im Fehlerfall)</li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Zweck der Verarbeitung
          </h2>
          <p className="text-slate-300">
            Bereitstellung des Forums, Authentifizierung, Moderation und
            Verbesserung der Anwendung im Rahmen des Studienprojekts.
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Speicherdauer
          </h2>
          <p className="text-slate-300">
            Daten werden nur für die Dauer des Studienprojekts gespeichert und
            danach gelöscht. Es erfolgt keine Weitergabe an Dritte.
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Rechte der Nutzer
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-300">
            <li>Auskunft über gespeicherte Daten</li>
            <li>Berichtigung oder Löschung (soweit technisch möglich)</li>
            <li>Widerruf der Einwilligung mit Wirkung für die Zukunft</li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Sicherheit
          </h2>
          <p className="text-slate-300">
            Passwörter werden mit bcrypt gehasht. Eingaben werden serverseitig
            mittels Zod validiert. Die Session-Verwaltung erfolgt über
            secure/HTTP-only Cookies (iron-session).
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">Kontakt</h2>
          <p className="text-slate-300">
            Fragen zum Datenschutz? <br />
            E-Mail: datenschutz@cyberforum.local
          </p>
        </section>
      </div>
    </div>
  );
}
