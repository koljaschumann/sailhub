import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, IconBadge, Icons, useToast } from '@tsc/ui';
import { useData, BOAT_CLASSES } from '../context/DataContext';
import { extractTextFromPDF, parseRegattaPDF, parseInvoicePDF, performOCR } from '../utils/pdfParser';

export function AddRegattaPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { boatData, addRegatta, crewDatabase, addPdfAttachment, getMaxCrewCount, importFromManage2Sail } = useData();

  // Mode: 'upload' | 'search' | 'manual'
  const [addMode, setAddMode] = useState('upload');
  const [step, setStep] = useState(0); // 0: Ergebnis, 1: Crew, 2: Rechnung

  // PDF Processing
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [invoiceProcessing, setInvoiceProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);
  const [currentPdfData, setCurrentPdfData] = useState(null);
  const [currentInvoiceData, setCurrentInvoiceData] = useState(null);

  // Parsed/Manual Data
  const [regattaName, setRegattaName] = useState('');
  const [date, setDate] = useState('');
  const [placement, setPlacement] = useState('');
  const [totalParticipants, setTotalParticipants] = useState('');
  const [raceCount, setRaceCount] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [selectedCrew, setSelectedCrew] = useState([]);

  // Drag
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingInvoice, setIsDraggingInvoice] = useState(false);
  const fileInputRef = useRef(null);
  const invoiceInputRef = useRef(null);

  // manage2sail
  const [m2sQuery, setM2sQuery] = useState('');
  const [m2sSearching, setM2sSearching] = useState(false);
  const [m2sResults, setM2sResults] = useState([]);
  const [m2sError, setM2sError] = useState(null);

  const maxCrew = getMaxCrewCount(boatData.bootsklasse);

  const inputClassName = `w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
    isDark
      ? 'bg-navy-800/50 border-navy-700 text-cream placeholder:text-cream/30 focus:border-mint-400/50 focus:bg-navy-800'
      : 'bg-white border-navy-900/10 text-navy-900 placeholder:text-light-muted focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20'
  }`;

  const labelClassName = `block text-sm font-medium mb-2 ${isDark ? 'text-cream/70' : 'text-light-muted'}`;

  const handleFileDrop = async (e, isInvoice = false) => {
    e.preventDefault();
    if (isInvoice) setIsDraggingInvoice(false);
    else setIsDragging(false);

    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;

    if (isInvoice) {
      await processInvoice(file);
    } else {
      await processResultPdf(file);
    }
  };

  const processResultPdf = async (file) => {
    if (!file.type.includes('pdf')) {
      addToast('Bitte eine PDF-Datei auswählen', 'error');
      return;
    }

    if (!boatData.segelnummer) {
      addToast('Bitte zuerst die Segelnummer in den Einstellungen eingeben', 'error');
      return;
    }

    setPdfProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        setCurrentPdfData(base64);

        let text = await extractTextFromPDF(base64);
        let useOCR = false;

        if (!text || text.length < 200) {
          console.log('Wenig Text, starte OCR...');
          text = await performOCR(base64, setOcrProgress);
          useOCR = true;
        }

        if (text) {
          let result = parseRegattaPDF(text, boatData.segelnummer, boatData);

          if (!result.participant && !useOCR) {
            console.log('Keine Platzierung gefunden, versuche OCR...');
            const ocrText = await performOCR(base64, setOcrProgress);
            if (ocrText) {
              const ocrResult = parseRegattaPDF(ocrText, boatData.segelnummer, boatData);
              if (ocrResult.participant) result = ocrResult;
            }
          }

          // Fill form fields
          if (result.regattaName) setRegattaName(result.regattaName);
          if (result.participant?.rank) setPlacement(result.participant.rank.toString());
          if (result.totalParticipants) setTotalParticipants(result.totalParticipants.toString());
          if (result.raceCount) setRaceCount(result.raceCount.toString());
          if (result.date) setDate(result.date);

          if (result.success) {
            addToast('Ergebnis erfolgreich erkannt!', 'success');
          } else {
            addToast(result.feedback || 'Bitte Daten manuell prüfen', 'warning');
          }
        }

        setPdfProcessing(false);
        setOcrProgress(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('PDF Processing Error:', err);
      addToast('Fehler beim Verarbeiten der PDF', 'error');
      setPdfProcessing(false);
    }
  };

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
          addToast('Betrag erkannt: ' + amount.toFixed(2) + ' €', 'success');
        }

        setInvoiceProcessing(false);
        setOcrProgress(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Invoice Processing Error:', err);
      setInvoiceProcessing(false);
    }
  };

  const searchManage2Sail = async () => {
    if (!m2sQuery.trim()) return;

    setM2sSearching(true);
    setM2sError(null);
    setM2sResults([]);

    try {
      // Check if input is a direct manage2sail URL
      if (m2sQuery.includes('manage2sail.com')) {
        // Use Firecrawl to scrape directly
        addToast('Lade Ergebnisse von manage2sail...', 'info');
        const data = await importFromManage2Sail(m2sQuery);

        if (data.regattaName) {
          setRegattaName(data.regattaName);
          if (data.regattaDate) setDate(data.regattaDate);
          if (data.placement) setPlacement(data.placement.toString());
          if (data.totalParticipants) setTotalParticipants(data.totalParticipants.toString());
          if (data.location) addToast(`📍 ${data.location}`, 'success');

          addToast('Regatta-Daten automatisch importiert!', 'success');
          setStep(maxCrew > 1 ? 1 : 2);
        } else {
          setM2sError('Keine Ergebnisse auf der Seite gefunden. Versuche einen anderen Link.');
        }
      } else {
        // Fallback to API search
        const year = new Date().getFullYear();
        const response = await fetch(`/api/search-regatta?query=${encodeURIComponent(m2sQuery)}&year=${year}`);
        const data = await response.json();

        if (data.success && data.results?.length > 0) {
          setM2sResults(data.results);
        } else {
          setM2sError('Keine Regatten gefunden. Tipp: Kopiere den Link direkt von manage2sail.com');
        }
      }
    } catch (err) {
      console.error('Manage2Sail import error:', err);
      if (err.message.includes('empty content')) {
        setM2sError('Die Seite konnte nicht geladen werden (JavaScript-Inhalt). Bitte nutze den "Manuell"-Modus oder lade das Ergebnis-PDF hoch.');
      } else {
        setM2sError('Fehler beim Import: ' + err.message);
      }
    } finally {
      setM2sSearching(false);
    }
  };

  const loadRegattaDetails = async (regatta) => {
    setM2sSearching(true);

    try {
      const sailParam = boatData.segelnummer
        ? `&sailNumber=${encodeURIComponent(boatData.segelnummer)}`
        : '';

      const response = await fetch(`/api/get-regatta?slug=${encodeURIComponent(regatta.slug)}${sailParam}`);
      const data = await response.json();

      if (data.success) {
        if (data.event?.name) setRegattaName(data.event.name);
        if (data.event?.date) setDate(data.event.date);
        if (data.participant?.rank) setPlacement(data.participant.rank.toString());
        if (data.participant?.totalInClass) setTotalParticipants(data.participant.totalInClass.toString());
        else if (data.totalParticipants) setTotalParticipants(data.totalParticipants.toString());
        if (data.participant?.raceCount || data.classes?.[0]?.raceCount) {
          setRaceCount((data.participant?.raceCount || data.classes[0].raceCount).toString());
        }

        addToast('Regatta-Daten geladen!', 'success');
        setStep(maxCrew > 1 ? 1 : 2);
      } else {
        setM2sError(data.error || 'Fehler beim Laden');
      }
    } catch (err) {
      setM2sError('Fehler: ' + err.message);
    } finally {
      setM2sSearching(false);
    }
  };

  const handleSave = () => {
    if (!regattaName) {
      addToast('Bitte Regatta-Name eingeben', 'error');
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
      source: addMode,
    };

    const savedRegatta = addRegatta(newRegatta);

    // Save PDF attachments
    if (currentPdfData || currentInvoiceData) {
      addPdfAttachment({
        regattaId: savedRegatta.id,
        regattaName,
        resultPdf: currentPdfData,
        invoicePdf: currentInvoiceData,
      });
    }

    addToast('Regatta gespeichert!', 'success');
    navigate('/');
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
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
          isDark
            ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
            : 'bg-mint-100 text-mint-600 border-mint-500/30'
        }`}>
          <span className="w-6 h-6">{Icons.plus}</span>
        </div>
        <div>
          <h1 className={`text-2xl font-display font-bold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
            Regatta hinzufügen
          </h1>
          <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
            Lade dein Ergebnis hoch oder suche auf manage2sail
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {progressLabels.map((label, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold transition-all border-2 ${
              index < step
                ? 'bg-mint-400 text-navy-900 border-navy-900'
                : index === step
                  ? isDark
                    ? 'bg-mint-400 text-navy-900 border-navy-900'
                    : 'bg-mint-400 text-navy-900 border-navy-900'
                  : isDark
                    ? 'bg-navy-800 text-cream/50 border-navy-700'
                    : 'bg-sage text-light-muted border-navy-900/10'
            }`}>
              {index < step ? <span className="w-5 h-5">{Icons.check}</span> : index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:inline ${
              index <= step
                ? isDark ? 'text-cream' : 'text-navy-900'
                : isDark ? 'text-cream/40' : 'text-light-muted'
            }`}>
              {label}
            </span>
            {index < progressLabels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded-full ${
                index < step
                  ? 'bg-mint-400'
                  : isDark ? 'bg-navy-700' : 'bg-navy-900/10'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Ergebnis */}
      {step === 0 && (
        <GlassCard>
          {/* Mode Switcher */}
          <div className={`flex gap-1 p-1.5 rounded-xl mb-6 border ${
            isDark
              ? 'bg-navy-800/50 border-navy-700'
              : 'bg-sage/50 border-navy-900/10'
          }`}>
            {[
              { id: 'upload', label: 'PDF Upload', icon: Icons.upload },
              { id: 'search', label: 'manage2sail', icon: Icons.search },
              { id: 'manual', label: 'Manuell', icon: Icons.edit },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setAddMode(mode.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  addMode === mode.id
                    ? isDark
                      ? 'bg-mint-400 text-navy-900'
                      : 'bg-white text-navy-900 shadow-sailhub border border-navy-900/10'
                    : isDark
                      ? 'text-cream/50 hover:text-mint-400'
                      : 'text-light-muted hover:text-mint-600'
                }`}
              >
                <span className="w-4 h-4">{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Upload Mode with decorative elements */}
          {addMode === 'upload' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => handleFileDrop(e, false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? isDark
                      ? 'border-mint-400 bg-mint-400/10'
                      : 'border-mint-500 bg-mint-100'
                    : isDark
                      ? 'border-navy-700 hover:border-mint-400/50 hover:bg-mint-400/5'
                      : 'border-navy-900/10 hover:border-mint-500/50 hover:bg-mint-50'
                }`}
              >
                {/* Grid pattern background */}
                <div className="grid-pattern absolute inset-0 pointer-events-none" />

                {/* Corner accent */}
                <div className="corner-accent absolute top-3 left-3" />
                <div className="corner-accent-br absolute bottom-3 right-3" />

                {/* Dots pattern */}
                <div className="dots-pattern absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-50" />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileDrop(e, false)}
                />
                <div className={`relative w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center border-2 ${
                  isDark
                    ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
                    : 'bg-mint-100 text-mint-600 border-mint-500/30'
                }`}>
                  {/* Glowing dot on icon */}
                  <div className="glow-dot absolute -top-1 -right-1" />
                  <span className={`w-7 h-7 ${pdfProcessing ? 'animate-spin' : ''}`}>
                    {pdfProcessing ? Icons.refresh : Icons.upload}
                  </span>
                </div>
                <p className={`relative font-semibold mb-1 ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                  {pdfProcessing
                    ? ocrProgress?.status || 'Verarbeite PDF...'
                    : 'Ergebnis-PDF hier ablegen'}
                </p>
                <p className={`relative text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                  oder klicken zum Auswählen
                </p>
              </div>
            </div>
          )}

          {/* Search Mode */}
          {addMode === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={m2sQuery}
                  onChange={(e) => setM2sQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchManage2Sail()}
                  placeholder="Regatta-Name oder manage2sail-Link"
                  className={inputClassName}
                />
                <Button onClick={searchManage2Sail} disabled={m2sSearching}>
                  {m2sSearching ? 'Suche...' : 'Suchen'}
                </Button>
              </div>

              {m2sError && (
                <div className={`p-4 rounded-xl border ${
                  isDark
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <p className="text-sm">{m2sError}</p>
                </div>
              )}

              {m2sResults.length > 0 && (
                <div className="space-y-2">
                  {m2sResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => loadRegattaDetails(r)}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${
                        isDark
                          ? 'bg-navy-800/30 border-navy-700/50 hover:border-mint-400/30 hover:bg-mint-400/5'
                          : 'bg-sage/30 border-navy-900/5 hover:border-mint-500/30 hover:bg-mint-50'
                      }`}
                    >
                      <p className={`font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                        {r.name}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                        {r.year}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>
                  Regatta-Name *
                </label>
                <input
                  type="text"
                  value={regattaName}
                  onChange={(e) => setRegattaName(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>
                  Datum
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClassName}>
                  Platzierung
                </label>
                <input
                  type="number"
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>
                  Teilnehmer
                </label>
                <input
                  type="number"
                  value={totalParticipants}
                  onChange={(e) => setTotalParticipants(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>
                  Wettfahrten
                </label>
                <input
                  type="number"
                  value={raceCount}
                  onChange={(e) => setRaceCount(e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(maxCrew > 1 ? 1 : 2)} disabled={!regattaName}>
              Weiter
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 1: Crew (nur bei Mehrpersonenbooten) */}
      {step === 1 && maxCrew > 1 && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <IconBadge icon={Icons.users} color="mint" variant="soft" />
            <div>
              <h3 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
                Crew auswählen
              </h3>
              <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
                {selectedCrew.length}/{maxCrew - 1} ausgewählt
              </p>
            </div>
          </div>

          {crewDatabase.length > 0 ? (
            <div className="space-y-2 mb-6">
              {crewDatabase.map(member => (
                <button
                  key={member.id}
                  onClick={() => toggleCrewMember(member)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 ${
                    selectedCrew.find(c => c.id === member.id)
                      ? isDark
                        ? 'bg-mint-400/15 border-mint-400/50 text-mint-400'
                        : 'bg-mint-100 border-mint-500/50 text-mint-600'
                      : isDark
                        ? 'bg-navy-800/30 border-navy-700/50 hover:border-mint-400/30 text-cream'
                        : 'bg-sage/30 border-navy-900/5 hover:border-mint-500/30 text-navy-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedCrew.find(c => c.id === member.id)
                        ? isDark
                          ? 'bg-mint-400 text-navy-900'
                          : 'bg-mint-500 text-white'
                        : isDark
                          ? 'bg-navy-700 text-cream/70'
                          : 'bg-navy-900/10 text-navy-900'
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                  {selectedCrew.find(c => c.id === member.id) && (
                    <span className="w-5 h-5">{Icons.check}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 rounded-xl border-2 border-dashed mb-6 ${
              isDark ? 'border-navy-700 text-cream/50' : 'border-navy-900/10 text-light-muted'
            }`}>
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-navy-800 text-cream/30' : 'bg-sage text-light-muted'
              }`}>
                <span className="w-6 h-6">{Icons.users}</span>
              </div>
              <p className="text-sm mb-1">Keine Crew-Mitglieder in der Datenbank.</p>
              <p className="text-xs">Du kannst sie in den Einstellungen hinzufügen.</p>
            </div>
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
          <div className="flex items-center gap-3 mb-6">
            <IconBadge icon={Icons.euro} color="mint" variant="soft" />
            <h3 className={`text-lg font-display font-semibold ${isDark ? 'text-cream' : 'text-navy-900'}`}>
              Rechnung
            </h3>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingInvoice(true); }}
            onDragLeave={() => setIsDraggingInvoice(false)}
            onDrop={(e) => handleFileDrop(e, true)}
            onClick={() => invoiceInputRef.current?.click()}
            className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 ${
              isDraggingInvoice
                ? isDark
                  ? 'border-mint-400 bg-mint-400/10'
                  : 'border-mint-500 bg-mint-100'
                : isDark
                  ? 'border-navy-700 hover:border-mint-400/50 hover:bg-mint-400/5'
                  : 'border-navy-900/10 hover:border-mint-500/50 hover:bg-mint-50'
            }`}
          >
            {/* Grid pattern background */}
            <div className="grid-pattern absolute inset-0 pointer-events-none" />

            {/* Corner accents */}
            <div className="corner-accent absolute top-3 left-3" />
            <div className="corner-accent-br absolute bottom-3 right-3" />

            {/* Dots pattern */}
            <div className="dots-pattern absolute bottom-0 left-0 w-16 h-16 pointer-events-none opacity-50" />

            <input
              ref={invoiceInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileDrop(e, true)}
            />
            <div className={`relative w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center border-2 ${
              isDark
                ? 'bg-mint-400/15 text-mint-400 border-mint-400/30'
                : 'bg-mint-100 text-mint-600 border-mint-500/30'
            }`}>
              {/* Glowing dot on icon */}
              <div className="glow-dot absolute -top-1 -right-1" />
              <span className={`w-7 h-7 ${invoiceProcessing ? 'animate-spin' : ''}`}>
                {invoiceProcessing ? Icons.refresh : Icons.receipt}
              </span>
            </div>
            <p className={`relative font-semibold mb-1 ${isDark ? 'text-cream' : 'text-navy-900'}`}>
              {invoiceProcessing
                ? ocrProgress?.status || 'Verarbeite Rechnung...'
                : 'Rechnung hier ablegen'}
            </p>
            <p className={`relative text-sm ${isDark ? 'text-cream/50' : 'text-light-muted'}`}>
              oder klicken zum Auswählen
            </p>
          </div>

          <div>
            <label className={labelClassName}>
              Rechnungsbetrag (€) *
            </label>
            <input
              type="text"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              placeholder="z.B. 45,00"
              className={inputClassName}
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(maxCrew > 1 ? 1 : 0)}>
              Zurück
            </Button>
            <Button onClick={handleSave}>
              Speichern
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default AddRegattaPage;
