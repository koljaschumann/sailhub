import { Link } from 'react-router-dom';
import { GlassCard, Button, Icons, useTheme } from '@tsc/ui';

export default function Datenschutz() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen px-4 py-12 ${isDark ? 'bg-navy-900' : 'bg-light-bg'}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10' : 'bg-teal-100'}`}>
                <span className={`w-7 h-7 ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
                  {Icons.sailboat}
                </span>
              </div>
              <span className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
                SailHub
              </span>
            </div>
          </Link>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Datenschutzinformationen
          </h1>
          <p className={`mt-2 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Stand: Januar 2026
          </p>
        </div>

        <GlassCard>
          <div className={`space-y-6 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>

            {/* Einleitung */}
            <section className={`p-4 rounded-lg ${isDark ? 'bg-navy-700/50' : 'bg-teal-50'}`}>
              <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-teal-700'}`}>
                <strong>Hinweis:</strong> Die Plattform SailHub wird von der Aitema GmbH im Auftrag
                des Tegeler Segel-Club e.V. betrieben. Der Verein ist verantwortlich für die
                Verarbeitung Ihrer Daten. Mit dem Verein wurde ein Auftragsverarbeitungsvertrag
                gemäß Art. 28 DSGVO geschlossen.
              </p>
            </section>

            {/* 1. Verantwortlicher */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                1. Verantwortlicher
              </h2>
              <p>
                <strong>Tegeler Segel-Club e.V.</strong><br />
                Jugendabteilung<br />
                Schwarzer Weg 27<br />
                13505 Berlin<br />
                E-Mail: jugend@tegeler-segel-club.de
              </p>
            </section>

            {/* 2. Auftragsverarbeiter */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                2. Auftragsverarbeiter (Plattformbetreiber)
              </h2>
              <p>
                <strong>Aitema GmbH</strong><br />
                Prenzlauer Allee 229<br />
                10405 Berlin<br />
                E-Mail: office@aitema.de
              </p>
              <p className="mt-2">
                Die Aitema GmbH verarbeitet Ihre Daten ausschließlich im Auftrag und nach
                Weisung des Tegeler Segel-Club e.V.
              </p>
            </section>

            {/* 3. Welche Daten */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                3. Welche Daten werden verarbeitet?
              </h2>

              <h3 className={`font-semibold mt-4 mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Stammdaten (bei Registrierung)
              </h3>
              <ul className={`list-disc list-inside ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>Vollständiger Name</li>
                <li>E-Mail-Adresse</li>
                <li>Rolle (Segler, Eltern, Trainer)</li>
                <li>Mitgliedsnummer (optional)</li>
              </ul>

              <h3 className={`font-semibold mt-4 mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Bankdaten (optional, bei Erstattungen)
              </h3>
              <ul className={`list-disc list-inside ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>IBAN</li>
                <li>Kontoinhaber</li>
              </ul>

              <h3 className={`font-semibold mt-4 mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Nutzungsdaten
              </h3>
              <ul className={`list-disc list-inside ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>Anmeldungen zu Veranstaltungen</li>
                <li>Eingereichte Erstattungsanträge</li>
                <li>Schadensmeldungen inkl. hochgeladener Fotos</li>
                <li>Charterbuchungen</li>
                <li>Förderanträge</li>
              </ul>

              <h3 className={`font-semibold mt-4 mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Technische Daten
              </h3>
              <ul className={`list-disc list-inside ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>IP-Adresse (anonymisiert gespeichert)</li>
                <li>Zeitpunkt des Zugriffs</li>
                <li>Verwendeter Browser/Gerät</li>
              </ul>
            </section>

            {/* 4. Zweck */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                4. Zweck der Datenverarbeitung
              </h2>
              <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>Verwaltung der Mitgliedschaft in der Jugendabteilung</li>
                <li>Organisation von Regatten und Trainingslagern</li>
                <li>Abwicklung von Startgeld-Erstattungen</li>
                <li>Koordination von Motorboot-Einsätzen</li>
                <li>Bearbeitung von Schadensmeldungen</li>
                <li>Verwaltung von Charterbuchungen</li>
                <li>Bearbeitung von Förderanträgen</li>
                <li>Erstellung von Statistiken und Jahresauswertungen</li>
                <li>Kommunikation innerhalb der Jugendabteilung</li>
              </ul>
            </section>

            {/* 5. Rechtsgrundlage */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                5. Rechtsgrundlage
              </h2>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>
                  <strong>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung):</strong> Für die Verarbeitung
                  Ihrer Daten nach Ihrer ausdrücklichen Zustimmung.
                </li>
                <li>
                  <strong>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung):</strong> Für die Erfüllung
                  der Mitgliedschaft und Nutzung der Vereinsdienste.
                </li>
                <li>
                  <strong>Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse):</strong> Für die
                  Sicherheit und Verbesserung der Plattform.
                </li>
              </ul>
            </section>

            {/* 6. Speicherdauer */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                6. Speicherdauer
              </h2>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>
                  <strong>Kontodaten:</strong> Werden gespeichert, solange Ihr Konto aktiv ist.
                  Nach Löschung des Kontos werden die Daten innerhalb von 30 Tagen entfernt.
                </li>
                <li>
                  <strong>Bankdaten und Zahlungsbelege:</strong> 10 Jahre gemäß §§ 147 AO, 257 HGB.
                </li>
                <li>
                  <strong>Technische Logs:</strong> Maximal 90 Tage.
                </li>
              </ul>
            </section>

            {/* 7. Datenweitergabe */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                7. Weitergabe an Dritte
              </h2>
              <p className="mb-2">Ihre Daten werden nur in folgenden Fällen an Dritte weitergegeben:</p>
              <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>An den Auftragsverarbeiter (Aitema GmbH) zur technischen Bereitstellung</li>
                <li>An Bankinstitute zur Durchführung von Erstattungen</li>
                <li>An Behörden, wenn gesetzlich vorgeschrieben</li>
              </ul>
              <p className="mt-2">
                Eine Weitergabe zu Werbezwecken oder an Dritte außerhalb der EU findet nicht statt.
              </p>
            </section>

            {/* 8. Hosting */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                8. Hosting und Datensicherheit
              </h2>
              <p>
                Die Plattform wird auf Servern der Hetzner Online GmbH in Deutschland gehostet.
                Alle Datenübertragungen erfolgen verschlüsselt (TLS/SSL). Der Zugang zu den Servern
                ist durch technische und organisatorische Maßnahmen geschützt.
              </p>
            </section>

            {/* 9. Ihre Rechte */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                9. Ihre Rechte
              </h2>
              <p className="mb-2">Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
              <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li><strong>Auskunft (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen.</li>
                <li><strong>Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger Daten verlangen.</li>
                <li><strong>Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen.</li>
                <li><strong>Einschränkung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen.</li>
                <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem gängigen Format erhalten.</li>
                <li><strong>Widerspruch (Art. 21 DSGVO):</strong> Sie können der Verarbeitung widersprechen.</li>
                <li><strong>Widerruf (Art. 7 Abs. 3 DSGVO):</strong> Sie können Ihre Einwilligung jederzeit widerrufen.</li>
              </ul>
              <p className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-navy-700/50' : 'bg-amber-50'}`}>
                <strong>Wichtig:</strong> Zur Ausübung Ihrer Rechte wenden Sie sich bitte an den
                Tegeler Segel-Club e.V. (Verantwortlicher), nicht an den Plattformbetreiber.
              </p>
            </section>

            {/* 10. Beschwerderecht */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                10. Beschwerderecht
              </h2>
              <p>
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren
                (Art. 77 DSGVO). Die zuständige Behörde ist:
              </p>
              <p className="mt-2">
                <strong>Berliner Beauftragte für Datenschutz und Informationsfreiheit</strong><br />
                Alt-Moabit 59-61<br />
                10555 Berlin<br />
                www.datenschutz-berlin.de
              </p>
            </section>

            {/* Kontakt */}
            <section className={`pt-4 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Kontakt bei Datenschutzfragen
              </h2>
              <p>
                <strong>Tegeler Segel-Club e.V.</strong> (Verantwortlicher)<br />
                E-Mail: jugend@tegeler-segel-club.de
              </p>
              <p className="mt-2">
                <strong>Aitema GmbH</strong> (Auftragsverarbeiter/Plattformbetreiber)<br />
                E-Mail: office@aitema.de
              </p>
            </section>
          </div>

          <div className="mt-8 flex gap-4">
            <Link to="/register">
              <Button variant="outline">
                Zurück zur Registrierung
              </Button>
            </Link>
            <Link to="/nutzungsbedingungen">
              <Button variant="outline">
                Nutzungsbedingungen
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
