import { Link } from 'react-router-dom';
import { GlassCard, Button, Icons, useTheme } from '@tsc/ui';

export default function Nutzungsbedingungen() {
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
            Nutzungsbedingungen
          </h1>
          <p className={`mt-2 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Stand: Januar 2026
          </p>
        </div>

        <GlassCard>
          <div className={`space-y-6 ${isDark ? 'text-cream/80' : 'text-light-text'}`}>

            {/* 1. Geltungsbereich */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                1. Geltungsbereich
              </h2>
              <p>
                Diese Nutzungsbedingungen gelten für die Nutzung der Plattform SailHub
                (nachfolgend "Plattform"), die von der Aitema GmbH (nachfolgend "Betreiber")
                im Auftrag des Tegeler Segel-Club e.V. (nachfolgend "Verein") bereitgestellt wird.
              </p>
              <p className="mt-2">
                Mit der Registrierung und Nutzung der Plattform akzeptieren Sie diese
                Nutzungsbedingungen.
              </p>
            </section>

            {/* 2. Registrierung */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                2. Registrierung und Nutzerkonto
              </h2>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>Die Nutzung der Plattform erfordert eine Registrierung mit gültiger E-Mail-Adresse.</li>
                <li>Sie sind verpflichtet, wahrheitsgemäße Angaben zu machen.</li>
                <li>Sie sind für die Geheimhaltung Ihrer Zugangsdaten verantwortlich.</li>
                <li>Die Weitergabe Ihres Kontos an Dritte ist nicht gestattet.</li>
                <li>Sie müssen den Verein unverzüglich informieren, wenn Sie einen Missbrauch Ihres Kontos vermuten.</li>
              </ul>
            </section>

            {/* 3. Nutzungsrechte */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                3. Nutzungsrechte und -pflichten
              </h2>
              <p className="mb-2">Die Plattform darf ausschließlich für folgende Zwecke genutzt werden:</p>
              <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>Anmeldung zu Vereinsveranstaltungen (Regatten, Trainingslager)</li>
                <li>Verwaltung von Startgeld-Erstattungen</li>
                <li>Meldung von Schäden an Vereinsequipment</li>
                <li>Buchung von Charterbooten</li>
                <li>Beantragung von Förderungen aus dem Jugendleistungsfonds</li>
                <li>Einsicht in Statistiken und Auswertungen</li>
              </ul>
            </section>

            {/* 4. Verbotene Nutzung */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                4. Verbotene Nutzung
              </h2>
              <p className="mb-2">Folgende Handlungen sind untersagt:</p>
              <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                <li>Manipulation oder Missbrauch der Plattform</li>
                <li>Eingabe falscher oder irreführender Daten</li>
                <li>Nutzung für vereinsfremde Zwecke</li>
                <li>Versuche, unbefugten Zugriff auf Daten anderer Nutzer zu erlangen</li>
                <li>Automatisierte Zugriffe (Bots, Scraping) ohne ausdrückliche Genehmigung</li>
              </ul>
            </section>

            {/* 5. Inhalte */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                5. Hochgeladene Inhalte
              </h2>
              <p>
                Sie sind für alle von Ihnen hochgeladenen Inhalte (z.B. Fotos bei Schadensmeldungen,
                Belege bei Erstattungsanträgen) selbst verantwortlich. Sie garantieren, dass Sie
                die erforderlichen Rechte an diesen Inhalten besitzen und keine Rechte Dritter verletzen.
              </p>
            </section>

            {/* 6. Verfügbarkeit */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                6. Verfügbarkeit
              </h2>
              <p>
                Der Betreiber bemüht sich um eine hohe Verfügbarkeit der Plattform, kann jedoch
                keine ununterbrochene Erreichbarkeit garantieren. Wartungsarbeiten werden nach
                Möglichkeit angekündigt. Für Ausfälle oder Datenverluste wird keine Haftung übernommen.
              </p>
            </section>

            {/* 7. Haftung */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                7. Haftungsbeschränkung
              </h2>
              <p>
                Die Nutzung der Plattform erfolgt auf eigene Gefahr. Der Betreiber haftet nur
                für Schäden, die durch vorsätzliches oder grob fahrlässiges Verhalten verursacht
                wurden. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit keine
                wesentlichen Vertragspflichten verletzt wurden.
              </p>
            </section>

            {/* 8. Kündigung */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                8. Kündigung und Sperrung
              </h2>
              <p>
                Sie können Ihr Konto jederzeit löschen. Bei Verstößen gegen diese Nutzungsbedingungen
                kann der Zugang zur Plattform eingeschränkt oder gesperrt werden. Der Verein behält
                sich vor, Konten inaktiver Nutzer nach angemessener Vorankündigung zu löschen.
              </p>
            </section>

            {/* 9. Änderungen */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                9. Änderungen der Nutzungsbedingungen
              </h2>
              <p>
                Der Betreiber kann diese Nutzungsbedingungen jederzeit ändern. Wesentliche
                Änderungen werden per E-Mail oder über die Plattform mitgeteilt. Die weitere
                Nutzung nach Inkrafttreten der Änderungen gilt als Zustimmung.
              </p>
            </section>

            {/* 10. Schlussbestimmungen */}
            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                10. Schlussbestimmungen
              </h2>
              <p>
                Es gilt deutsches Recht. Gerichtsstand ist Berlin, soweit gesetzlich zulässig.
                Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen
                Bestimmungen unberührt.
              </p>
            </section>

            {/* Kontakt */}
            <section className={`pt-4 border-t ${isDark ? 'border-navy-700' : 'border-light-border'}`}>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-cream' : 'text-light-text'}`}>
                Kontakt
              </h2>
              <p>
                Bei Fragen zu diesen Nutzungsbedingungen wenden Sie sich bitte an:<br />
                <strong>Tegeler Segel-Club e.V.</strong><br />
                Jugendabteilung<br />
                Schwarzer Weg 27, 13505 Berlin<br />
                E-Mail: jugend@tegeler-segel-club.de
              </p>
            </section>
          </div>

          <div className="mt-8 flex gap-4">
            <Link to="/register">
              <Button variant="outline">
                Zurück zur Registrierung
              </Button>
            </Link>
            <Link to="/datenschutz">
              <Button variant="outline">
                Datenschutzinformationen
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
