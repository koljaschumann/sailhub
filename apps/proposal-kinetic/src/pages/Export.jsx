import { useState } from 'react';
import { useTheme, GlassCard, Button, IconBadge, Icons, useToast } from '@tsc/ui';
import { useData } from '../context/DataContext';
import { downloadSummaryPDF, exportStatsPDF, exportCSV } from '../utils/pdfExport';
import { downloadSEPAXML } from '../utils/sepaGenerator';

export function ExportPage() {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { regatten, boatData, currentSeason, stats, pdfAttachments } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = regatten.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0);

  const handleExportPDF = () => {
    if (regatten.length === 0) {
      addToast('Keine Regatten vorhanden', 'error');
      return;
    }
    downloadSummaryPDF(regatten, boatData, currentSeason);
    addToast('PDF wurde heruntergeladen', 'success');
  };

  const handleExportStats = () => {
    if (regatten.length === 0) {
      addToast('Keine Regatten vorhanden', 'error');
      return;
    }
    exportStatsPDF(regatten, boatData, currentSeason, stats);
    addToast('Statistik-PDF wurde heruntergeladen', 'success');
  };

  const handleExportCSV = () => {
    if (regatten.length === 0) {
      addToast('Keine Regatten vorhanden', 'error');
      return;
    }
    exportCSV(regatten, boatData, currentSeason);
    addToast('CSV wurde heruntergeladen', 'success');
  };

  const handleExportSEPA = () => {
    if (!boatData.iban) {
      addToast('Bitte zuerst IBAN in den Einstellungen eingeben', 'error');
      return;
    }

    const payments = [{
      name: boatData.kontoinhaber || boatData.seglername,
      iban: boatData.iban,
      bic: '',
      amount: totalAmount,
      reference: `TSC Startgeld ${currentSeason} ${boatData.seglername}`,
    }];

    const creditorInfo = {
      name: 'Tegeler Segel-Club e.V.',
      iban: 'DE00000000000000000000', // Placeholder
      bic: '',
    };

    downloadSEPAXML(payments, creditorInfo, `SEPA_Startgeld_${currentSeason}.xml`);
    addToast('SEPA-XML wurde heruntergeladen', 'success');
  };

  const handleSubmitOnline = async () => {
    if (regatten.length === 0) {
      addToast('Keine Regatten vorhanden', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('_subject', `TSC Startgeld ${currentSeason}: ${boatData.seglername} - ${totalAmount.toFixed(2)} €`);
      formData.append('Saison', currentSeason);
      formData.append('Antragsteller', boatData.seglername);
      formData.append('Segelnummer', boatData.segelnummer);
      formData.append('Bootsklasse', boatData.bootsklasse);
      formData.append('IBAN', boatData.iban);
      formData.append('Gesamtbetrag', `${totalAmount.toFixed(2)} €`);

      regatten.forEach((r, i) => {
        let details = `${r.regattaName}: ${r.invoiceAmount?.toFixed(2)} € (Platz ${r.placement})`;
        if (r.crew?.length > 0) {
          details += ` | Crew: ${r.crew.map(c => c.name).join(', ')}`;
        }
        formData.append(`Regatta_${i + 1}`, details);
      });

      // Note: In production, configure actual endpoint
      const response = await fetch('https://formsubmit.co/ajax/kolja.schumann@aitema.de', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        addToast('Antrag erfolgreich eingereicht!', 'success');
      } else {
        throw new Error(result.message || 'Einreichung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Submit Error:', err);
      addToast('Fehler beim Einreichen. Bitte als PDF exportieren.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMail = () => {
    const subject = encodeURIComponent(`Startgeld-Erstattung ${currentSeason} - ${boatData.seglername}`);
    const body = encodeURIComponent(
      `Sehr geehrte Damen und Herren,\n\n` +
      `hiermit beantrage ich die Erstattung meiner Startgelder für die Saison ${currentSeason}.\n\n` +
      `Segler: ${boatData.seglername}\n` +
      `Segelnummer: ${boatData.segelnummer}\n` +
      `Bootsklasse: ${boatData.bootsklasse}\n\n` +
      `Anzahl Regatten: ${regatten.length}\n` +
      `Gesamtbetrag: ${totalAmount.toFixed(2)} €\n\n` +
      `Die Belege sind als Anhang beigefügt.\n\n` +
      `Mit freundlichen Grüßen\n${boatData.seglername}`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Export & Antrag
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Exportiere deine Daten oder reiche den Antrag ein
        </p>
      </div>

      {/* Zusammenfassung */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Zusammenfassung
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>Regatten</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-cream' : 'text-light-text'}`}>
              {regatten.length}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-navy-800/50' : 'bg-light-border/30'}`}>
            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>Gesamtbetrag</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-gold-400' : 'text-teal-600'}`}>
              {totalAmount.toFixed(2)} €
            </p>
          </div>
        </div>

        {regatten.length > 0 && (
          <div className="space-y-2">
            {regatten.map(r => (
              <div
                key={r.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-navy-800/30' : 'bg-light-border/20'
                }`}
              >
                <div>
                  <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                    {r.regattaName}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    {r.date} • Platz {r.placement}
                  </p>
                </div>
                <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                  {(r.invoiceAmount || 0).toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Export Options */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Export-Optionen
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            onClick={handleExportPDF}
            icon={Icons.download}
            className="justify-start"
          >
            Antrag PDF
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportStats}
            icon={Icons.chart}
            className="justify-start"
          >
            Statistik PDF
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            icon={Icons.table}
            className="justify-start"
          >
            CSV Export
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportSEPA}
            icon={Icons.bank}
            className="justify-start"
          >
            SEPA XML
          </Button>
        </div>
      </GlassCard>

      {/* Submit Options */}
      <GlassCard>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Antrag einreichen
        </h2>

        <div className="space-y-3">
          <Button
            onClick={handleSubmitOnline}
            disabled={regatten.length === 0 || isSubmitting}
            icon={Icons.send}
            className="w-full"
          >
            {isSubmitting ? 'Wird gesendet...' : 'Online einreichen'}
          </Button>

          <Button
            variant="secondary"
            onClick={handleOpenMail}
            disabled={regatten.length === 0}
            icon={Icons.mail}
            className="w-full"
          >
            Per E-Mail senden
          </Button>
        </div>

        <p className={`text-sm mt-4 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
          Tipp: Lade zuerst die PDF herunter und hänge sie an die E-Mail an.
        </p>
      </GlassCard>
    </div>
  );
}

export default ExportPage;
