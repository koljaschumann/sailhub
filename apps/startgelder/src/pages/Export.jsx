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
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
          isDark
            ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
            : 'bg-mint-100 text-mint-600 border-mint-500/30'
        }`}>
          <span className="w-6 h-6">{Icons.send}</span>
        </div>
        <div>
          <h1 className={`text-2xl font-display font-bold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Export & Antrag
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Exportiere deine Daten oder reiche den Antrag ein
          </p>
        </div>
      </div>

      {/* Zusammenfassung with decorative elements */}
      <GlassCard className="relative overflow-hidden">
        {/* Subtle noise texture for depth */}
        <div className="noise-texture absolute inset-0 pointer-events-none" />

        {/* Corner accent */}
        <div className="corner-accent absolute top-4 left-4" />

        <div className="relative flex items-center gap-3 mb-6">
          <IconBadge icon={Icons.chart} color="mint" variant="soft" />
          <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Zusammenfassung
          </h2>
        </div>

        <div className="relative grid grid-cols-2 gap-4 mb-6">
          <div className={`p-5 rounded-2xl border ${
            isDark
              ? 'bg-navy-800/50 border-navy-700'
              : 'bg-sage/50 border-navy-900/10'
          }`}>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
              Regatten
            </p>
            <p className={`text-3xl font-bold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
              {regatten.length}
            </p>
          </div>
          <div className={`relative p-5 rounded-2xl border overflow-hidden ${
            isDark
              ? 'bg-mint-400/10 border-mint-400/30'
              : 'bg-mint-100 border-mint-500/30'
          }`}>
            {/* Shimmer effect on total amount */}
            <div className="shimmer absolute inset-0 pointer-events-none" />

            {/* Dots pattern accent */}
            <div className="dots-pattern absolute top-0 right-0 w-12 h-12 pointer-events-none opacity-30" />

            <p className={`relative text-sm font-medium mb-1 ${isDark ? 'text-mint-400/70' : 'text-mint-600'}`}>
              Gesamtbetrag
            </p>
            <p className={`relative text-3xl font-bold ${isDark ? 'text-mint-400' : 'text-mint-600'}`}>
              {totalAmount.toFixed(2)} €
            </p>
          </div>
        </div>

        {regatten.length > 0 && (
          <div className="space-y-2">
            {regatten.map(r => (
              <div
                key={r.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  isDark
                    ? 'bg-navy-800/30 border-navy-700/50'
                    : 'bg-sage/30 border-navy-900/5'
                }`}
              >
                <div>
                  <p className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                    {r.regattaName}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    {r.date} • Platz {r.placement}
                  </p>
                </div>
                <p className={`font-bold ${isDark ? 'text-mint-400' : 'text-mint-600'}`}>
                  {(r.invoiceAmount || 0).toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        )}

        {regatten.length === 0 && (
          <div className={`text-center py-8 rounded-xl border-2 border-dashed ${
            isDark ? 'border-navy-700 text-cream/50' : 'border-navy-900/10 text-light-muted'
          }`}>
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-navy-800 text-cream/30' : 'bg-sage text-light-muted'
            }`}>
              <span className="w-6 h-6">{Icons.boat}</span>
            </div>
            <p className="text-sm">Noch keine Regatten vorhanden</p>
          </div>
        )}
      </GlassCard>

      {/* Export Options */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <IconBadge icon={Icons.download} color="mint" variant="soft" />
          <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Export-Optionen
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportPDF}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              isDark
                ? 'bg-navy-800/30 border-navy-700 hover:border-mint-400/40 hover:bg-mint-400/5'
                : 'bg-white border-navy-900/10 hover:border-mint-500/40 hover:bg-mint-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-500'
            }`}>
              <span className="w-5 h-5">{Icons.download}</span>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>Antrag PDF</p>
              <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>Offizieller Antrag</p>
            </div>
          </button>

          <button
            onClick={handleExportStats}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              isDark
                ? 'bg-navy-800/30 border-navy-700 hover:border-mint-400/40 hover:bg-mint-400/5'
                : 'bg-white border-navy-900/10 hover:border-mint-500/40 hover:bg-mint-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-500'
            }`}>
              <span className="w-5 h-5">{Icons.chart}</span>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>Statistik PDF</p>
              <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>Mit Diagrammen</p>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              isDark
                ? 'bg-navy-800/30 border-navy-700 hover:border-mint-400/40 hover:bg-mint-400/5'
                : 'bg-white border-navy-900/10 hover:border-mint-500/40 hover:bg-mint-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-500'
            }`}>
              <span className="w-5 h-5">{Icons.table}</span>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>CSV Export</p>
              <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>Für Excel</p>
            </div>
          </button>

          <button
            onClick={handleExportSEPA}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              isDark
                ? 'bg-navy-800/30 border-navy-700 hover:border-mint-400/40 hover:bg-mint-400/5'
                : 'bg-white border-navy-900/10 hover:border-mint-500/40 hover:bg-mint-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-100 text-cyan-500'
            }`}>
              <span className="w-5 h-5">{Icons.euro}</span>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>SEPA XML</p>
              <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>Überweisung</p>
            </div>
          </button>
        </div>
      </GlassCard>

      {/* Submit Options with rich decorations */}
      <GlassCard variant="mint" className="relative overflow-hidden">
        {/* Geometric ring in background */}
        <div className={`geometric-ring absolute -bottom-20 -right-20 w-56 h-56 rounded-full pointer-events-none ${
          isDark ? 'border-mint-400' : 'border-navy-900'
        }`} />

        {/* Dots pattern accent */}
        <div className="dots-pattern-lg absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-40" />

        {/* Corner accent bar */}
        <div className="corner-accent absolute top-3 left-3" />

        <div className="relative flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-mint-400 text-navy-900' : 'bg-mint-500 text-white'
          }`}>
            <span className="w-5 h-5">{Icons.send}</span>
          </div>
          <h2 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Antrag einreichen
          </h2>
        </div>

        <div className="relative space-y-3">
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

        <p className={`relative text-sm mt-4 flex items-center gap-2 ${isDark ? 'text-cream/60' : 'text-navy-900/60'}`}>
          <span className="w-4 h-4">{Icons.sparkles}</span>
          Tipp: Lade zuerst die PDF herunter und hänge sie an die E-Mail an.
        </p>
      </GlassCard>
    </div>
  );
}

export default ExportPage;
