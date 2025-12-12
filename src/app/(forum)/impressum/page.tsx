export default function ImpressumPage() {
  return (
    <div className="container">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Impressum</h1>
          <p className="text-slate-400">
            Angaben gemäß § 5 TMG (Beispieldaten für das Studienprojekt).
          </p>
        </div>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Betreiber der Website
          </h2>
          <p className="text-slate-300">
            CyberForum (Studienprojekt) <br />
            Musterstraße 1 <br />
            12345 Musterstadt <br />
            Deutschland
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">Kontakt</h2>
          <p className="text-slate-300">
            E-Mail: kontakt@cyberforum.local <br />
            Telefon: +49 (0) 123 456789
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Verantwortlich für den Inhalt
          </h2>
          <p className="text-slate-300">
            Kai Beispiel <br />
            E-Mail: kai.beispiel@cyberforum.local
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-3">
            Haftungsausschluss
          </h2>
          <p className="text-slate-300">
            Dies ist ein rein akademisches Projekt. Es werden keine echten
            Dienste angeboten und keine realen personenbezogenen Daten erhoben.
          </p>
        </section>
      </div>
    </div>
  );
}
