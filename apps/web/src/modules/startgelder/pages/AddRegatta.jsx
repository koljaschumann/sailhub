import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTheme, GlassCard, Button, Icons, useToast } from '@tsc/ui';
import { useData, BOAT_CLASSES } from '../context/DataContext';
import { searchManage2SailRegattas, extractRegattaDetails } from '@tsc/supabase';
import { extractTextFromPDF, parseRegattaPDF, parseInvoicePDF, performOCR } from '../utils/pdfParser';
import { fuzzySearchRegattas, deduplicateResults } from '../utils/fuzzySearch';

// Debounce helper
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function AddRegattaPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const { boatData, addRegatta, crewDatabase, addPdfAttachment, getMaxCrewCount, regattas: existingRegattas } = useData();

  // Steps: 0 = Ergebnis suchen, 1 = Crew (nur Mehrpersonenboote), 2 = Rechnung
  const [step, setStep] = useState(0);

  // Jahr-Auswahl
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Suche
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedRegatta, setSelectedRegatta] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Detail-Extraktion
  const [isExtracting, setIsExtracting] = useState(false);

  // Formular-Daten (werden auto-gefüllt nach Auswahl)
  const [regattaName, setRegattaName] = useState('');
  const [date, setDate] = useState('');
  const [placement, setPlacement] = useState('');
  const [totalParticipants, setTotalParticipants] = useState('');
  const [raceCount, setRaceCount] = useState('');
  const [sailorFound, setSailorFound] = useState(null);

  // Rechnung
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [currentInvoiceData, setCurrentInvoiceData] = useState(null);
  const [invoiceProcessing, setInvoiceProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [isDraggingInvoice, setIsDraggingInvoice] = useState(false);
  const invoiceInputRef = useRef(null);

  // Crew
  const [selectedCrew, setSelectedCrew] = useState([]);
  const maxCrew = getMaxCrewCount(boatData.bootsklasse);

  // Debounced Suche
  const performSearch = useCallback(async (query, year) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setShowDropdown(true);

    try {
      // 1. Lokale Fuzzy-Suche (sofort)
      const localResults = fuzzySearchRegattas(query, existingRegattas || []);

      // 2. Gemini-Suche auf manage2sail (parallel)
      const geminiResults = await searchManage2SailRegattas(query, year);

      // 3. Kombinieren und deduplizieren
      const combined = deduplicateResults([
        ...localResults,
        ...geminiResults
      ]);

      setSearchResults(combined);

      if (combined.length === 0) {
        setSearchError('Keine Regatten gefunden. Versuche einen anderen Suchbegriff.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Suche fehlgeschlagen: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  }, [existingRegattas]);

  // Debounced version
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 500),
    [performSearch]
  );

  // Suche bei Query-Änderung
  useEffect(() => {
    debouncedSearch(searchQuery, selectedYear);
  }, [searchQuery, selectedYear, debouncedSearch]);

  // Regatta auswählen und Details laden
  const selectRegatta = async (regatta) => {
    setSelectedRegatta(regatta);
    setShowDropdown(false);
    setSearchQuery(regatta.name || regatta.regattaName);

    // Wenn URL vorhanden → Details via Gemini extrahieren
    if (regatta.url && regatta.source === 'gemini') {
      setIsExtracting(true);
      setSailorFound(null);

      try {
        const details = await extractRegattaDetails(regatta.url, boatData.segelnummer);

        // Auto-Fill
        if (details.regattaName) setRegattaName(details.regattaName);
        if (details.date) setDate(details.date);
        if (details.totalParticipants) setTotalParticipants(details.totalParticipants.toString());
        if (details.raceCount) setRaceCount(details.raceCount.toString());

        // Segler-Ergebnis
        if (details.sailorResult?.found) {
          setPlacement(details.sailorResult.placement?.toString() || '');
          setSailorFound(details.sailorResult);
          addToast(`Deine Platzierung gefunden: Platz ${details.sailorResult.placement}!`, 'success');
        } else {
          setSailorFound({ found: false });
          addToast('Regatta geladen. Bitte Platzierung manuell eingeben.', 'warning');
        }
      } catch (err) {
        console.error('Extraction error:', err);
        addToast('Fehler beim Laden der Details. Bitte manuell ausfüllen.', 'error');
        // Fallback: Basisdaten aus Suchergebnis
        setRegattaName(regatta.name || '');
        if (regatta.date) setDate(regatta.date);
      } finally {
        setIsExtracting(false);
      }
    } else {
      // Lokale Regatta → Daten direkt übernehmen
      setRegattaName(regatta.name || regatta.regattaName || '');
      if (regatta.date || regatta.regattaDate) {
        const d = regatta.date || regatta.regattaDate;
        setDate(typeof d === 'string' ? d : d?.toISOString?.()?.split('T')[0] || '');
      }
      if (regatta.placement) setPlacement(regatta.placement.toString());
      if (regatta.totalParticipants) setTotalParticipants(regatta.totalParticipants.toString());
      addToast('Regatta aus lokaler Datenbank geladen', 'success');
    }
  };

  // Rechnung verarbeiten
  const processInvoice = async (file) => {
    setInvoiceProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        setCurrentInvoiceData(base64);

        const amount = await parseInvoicePDF(base64, setOcrProgress);
        if (amount) {
          setInvoiceAmount(amount.toFixed(2).replace('.', ','));
          addToast(`Betrag erkannt: ${amount.toFixed(2)} €`, 'success');
        } else {
          addToast('Betrag konnte nicht erkannt werden. Bitte manuell eingeben.', 'warning');
        }

        setInvoiceProcessing(false);
        setOcrProgress(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Invoice Processing Error:', err);
      addToast('Fehler beim Verarbeiten der Rechnung', 'error');
      setInvoiceProcessing(false);
    }
  };

  const handleInvoiceDrop = async (e) => {
    e.preventDefault();
    setIsDraggingInvoice(false);

    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      addToast('Bitte eine PDF- oder Bild-Datei auswählen', 'error');
      return;
    }

    await processInvoice(file);
  };

  // Speichern
  const handleSave = () => {
    if (!regattaName) {
      addToast('Bitte Regatta-Name eingeben', 'error');
      return;
    }

    if (!currentInvoiceData) {
      addToast('Bitte Rechnung hochladen (erforderlich für Erstattung)', 'error');
      return;
    }

    const amount = parseFloat(invoiceAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      addToast('Bitte gültigen Rechnungsbetrag eingeben', 'error');
      return;
    }

    const newRegatta = {
      regattaName,
      date,
      placement: parseInt(placement) || null,
      totalParticipants: parseInt(totalParticipants) || null,
      raceCount: parseInt(raceCount) || null,
      invoiceAmount: amount,
      crew: selectedCrew,
      source: 'manage2sail-search',
      manage2sailUrl: selectedRegatta?.url || null,
    };

    const savedRegatta = addRegatta(newRegatta);

    // PDF-Anhang speichern
    if (currentInvoiceData) {
      addPdfAttachment({
        regattaId: savedRegatta.id,
        regattaName,
        resultPdf: null,
        invoicePdf: currentInvoiceData,
      });
    }

    addToast('Regatta gespeichert!', 'success');
    setCurrentPage('dashboard');
  };

  const toggleCrewMember = (member) => {
    if (selectedCrew.find(c => c.id === member.id)) {
      setSelectedCrew(prev => prev.filter(c => c.id !== member.id));
    } else if (selectedCrew.length < maxCrew - 1) {
      setSelectedCrew(prev => [...prev, member]);
    }
  };

  const progressLabels = maxCrew > 1
    ? ['Ergebnis', 'Crew', 'Rechnung']
    : ['Ergebnis', 'Rechnung'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Regatta hinzufügen
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Suche deine Regatta auf manage2sail - wir füllen alles automatisch aus
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {progressLabels.map((label, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
              index < step
                ? 'bg-success text-white'
                : index === step
                  ? isDark ? 'bg-gold-400 text-navy-900' : 'bg-teal-500 text-white'
                  : isDark ? 'bg-navy-700 text-cream/50' : 'bg-light-border text-light-muted'
            }`}>
              {index < step ? Icons.check : index + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${
              index <= step ? isDark ? 'text-cream' : 'text-light-text' : isDark ? 'text-cream/40' : 'text-light-muted'
            }`}>{label}</span>
            {index < progressLabels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${index < step ? 'bg-success' : isDark ? 'bg-navy-700' : 'bg-light-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Regatta suchen */}
      {step === 0 && (
        <GlassCard>
          {/* Jahr-Auswahl */}
          <div className="mb-4">
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Jahr
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={`w-32 px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Suchfeld */}
          <div className="relative mb-4">
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Regatta suchen
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="z.B. Rahnsdorfer Optipokal, IDM ILCA..."
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                }`}
              />
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 ${
                isSearching ? 'animate-spin' : ''
              } ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                {isSearching ? Icons.refresh : Icons.search}
              </div>
            </div>

            {/* Suchergebnisse Dropdown */}
            {showDropdown && (searchResults.length > 0 || searchError) && (
              <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-xl max-h-64 overflow-y-auto ${
                isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-light-border'
              }`}>
                {searchError && searchResults.length === 0 ? (
                  <div className={`p-4 text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    {searchError}
                  </div>
                ) : (
                  searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectRegatta(result)}
                      className={`w-full text-left p-3 border-b last:border-b-0 transition-colors ${
                        isDark
                          ? 'border-navy-700 hover:bg-navy-700/50'
                          : 'border-light-border hover:bg-light-border/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isDark ? 'text-cream' : 'text-light-text'}`}>
                            {result.name || result.regattaName}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                            {result.date && new Date(result.date).toLocaleDateString('de-DE')}
                            {result.location && ` • ${result.location}`}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                          result.confidence === 'high'
                            ? 'bg-success/20 text-success'
                            : result.confidence === 'medium'
                              ? isDark ? 'bg-gold-400/20 text-gold-400' : 'bg-amber-100 text-amber-700'
                              : isDark ? 'bg-navy-700 text-cream/50' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {result.source === 'local' ? 'Lokal' :
                           result.confidence === 'high' ? 'Exakt' :
                           result.confidence === 'medium' ? 'Ähnlich' : 'Möglich'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
                {isSearching && (
                  <div className={`p-3 text-sm text-center ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                    <span className="inline-block w-4 h-4 mr-2 animate-spin">{Icons.refresh}</span>
                    Suche auf manage2sail.com...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lade-Anzeige bei Extraktion */}
          {isExtracting && (
            <div className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${
              isDark ? 'bg-navy-800/50' : 'bg-light-border/30'
            }`}>
              <span className="w-5 h-5 animate-spin">{Icons.refresh}</span>
              <span className={isDark ? 'text-cream' : 'text-light-text'}>
                Lade Regatta-Details und suche deine Platzierung...
              </span>
            </div>
          )}

          {/* Segler gefunden Anzeige */}
          {sailorFound && (
            <div className={`p-4 rounded-lg mb-4 ${
              sailorFound.found
                ? 'bg-success/10 border border-success/30'
                : isDark ? 'bg-navy-800/50' : 'bg-amber-50 border border-amber-200'
            }`}>
              {sailorFound.found ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 text-success">{Icons.check}</span>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
                      Deine Platzierung wurde gefunden!
                    </p>
                    <p className={`text-sm ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                      {sailorFound.name} ({sailorFound.sailNumber}) - Platz {sailorFound.placement}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 ${isDark ? 'text-gold-400' : 'text-amber-500'}`}>{Icons.warning}</span>
                  <p className={isDark ? 'text-cream' : 'text-light-text'}>
                    Segelnummer nicht gefunden. Bitte Platzierung manuell eingeben.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Formular-Felder */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                  Regatta-Name *
                </label>
                <input
                  type="text"
                  value={regattaName}
                  onChange={(e) => setRegattaName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                  Datum
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                  Platzierung
                </label>
                <input
                  type="number"
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                  Teilnehmer
                </label>
                <input
                  type="number"
                  value={totalParticipants}
                  onChange={(e) => setTotalParticipants(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                  Wettfahrten
                </label>
                <input
                  type="number"
                  value={raceCount}
                  onChange={(e) => setRaceCount(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-navy-800 border-navy-700 text-cream'
                      : 'bg-white border-light-border text-light-text'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(maxCrew > 1 ? 1 : 2)} disabled={!regattaName || isExtracting}>
              Weiter
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 1: Crew (nur bei Mehrpersonenbooten) */}
      {step === 1 && maxCrew > 1 && (
        <GlassCard>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Crew auswählen ({selectedCrew.length}/{maxCrew - 1})
          </h3>

          {crewDatabase.length > 0 ? (
            <div className="space-y-2 mb-4">
              {crewDatabase.map(member => (
                <button
                  key={member.id}
                  onClick={() => toggleCrewMember(member)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    selectedCrew.find(c => c.id === member.id)
                      ? isDark ? 'bg-gold-400/20 border border-gold-400/50' : 'bg-teal-500/20 border border-teal-500/50'
                      : isDark ? 'bg-navy-800/50 hover:bg-navy-800' : 'bg-light-border/30 hover:bg-light-border'
                  }`}
                >
                  <span className={isDark ? 'text-cream' : 'text-light-text'}>
                    {member.name}
                  </span>
                  {selectedCrew.find(c => c.id === member.id) && (
                    <span className={isDark ? 'text-gold-400' : 'text-teal-500'}>{Icons.check}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className={`mb-4 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              Keine Crew-Mitglieder in der Datenbank. Du kannst sie in den Einstellungen hinzufügen.
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>
              Zurück
            </Button>
            <Button onClick={() => setStep(2)}>
              Weiter
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Rechnung (Step 1 bei Einpersonenbooten) */}
      {(step === 2 || (step === 1 && maxCrew <= 1)) && (
        <GlassCard>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Rechnung hochladen
          </h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-cream/60' : 'text-light-muted'}`}>
            Die Rechnung ist als Nachweis für die Erstattung erforderlich.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingInvoice(true); }}
            onDragLeave={() => setIsDraggingInvoice(false)}
            onDrop={handleInvoiceDrop}
            onClick={() => invoiceInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
              isDraggingInvoice
                ? isDark ? 'border-gold-400 bg-gold-400/10' : 'border-teal-500 bg-teal-500/10'
                : currentInvoiceData
                  ? 'border-success bg-success/10'
                  : isDark ? 'border-navy-700 hover:border-gold-400/50' : 'border-light-border hover:border-teal-500/50'
            }`}
          >
            <input
              ref={invoiceInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleInvoiceDrop}
            />
            <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
              currentInvoiceData
                ? 'bg-success/20 text-success'
                : isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
            }`}>
              {invoiceProcessing ? Icons.refresh : currentInvoiceData ? Icons.check : Icons.receipt}
            </div>
            <p className={isDark ? 'text-cream' : 'text-light-text'}>
              {invoiceProcessing
                ? ocrProgress?.status || 'Verarbeite Rechnung...'
                : currentInvoiceData
                  ? 'Rechnung hochgeladen ✓'
                  : 'Rechnung hier ablegen oder klicken'}
            </p>
          </div>

          {currentInvoiceData && (
            <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-success/10' : 'bg-green-50'}`}>
              <p className={`text-sm ${isDark ? 'text-success' : 'text-green-700'}`}>
                PDF hochgeladen. Betrag wird im Feld unten angezeigt.
              </p>
            </div>
          )}

          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Rechnungsbetrag (€) *
            </label>
            <input
              type="text"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              placeholder="z.B. 45,00"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-navy-800 border-navy-700 text-cream'
                  : 'bg-white border-light-border text-light-text'
              }`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              Der Betrag wurde automatisch erkannt. Du kannst ihn manuell korrigieren.
            </p>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(maxCrew > 1 ? 1 : 0)}>
              Zurück
            </Button>
            <Button onClick={handleSave} disabled={!currentInvoiceData}>
              Speichern
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default AddRegattaPage;
