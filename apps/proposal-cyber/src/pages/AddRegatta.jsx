import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, GlassCard, Button, Icons, useToast } from '@tsc/ui';
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
      <div>
        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-cream' : 'text-light-text'}`}>
          Regatta hinzufügen
        </h1>
        <p className={isDark ? 'text-cream/60' : 'text-light-muted'}>
          Lade dein Ergebnis hoch oder suche auf manage2sail
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {progressLabels.map((label, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${index < step
              ? 'bg-success text-white'
              : index === step
                ? isDark ? 'bg-gold-400 text-navy-900' : 'bg-teal-500 text-white'
                : isDark ? 'bg-navy-700 text-cream/50' : 'bg-light-border text-light-muted'
              }`}>
              {index < step ? Icons.check : index + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${index <= step ? isDark ? 'text-cream' : 'text-light-text' : isDark ? 'text-cream/40' : 'text-light-muted'
              }`}>{label}</span>
            {index < progressLabels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${index < step ? 'bg-success' : isDark ? 'bg-navy-700' : 'bg-light-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Ergebnis */}
      {step === 0 && (
        <GlassCard>
          {/* Mode Switcher */}
          <div className={`flex gap-1 p-1 rounded-lg mb-6 ${isDark ? 'bg-navy-800/50' : 'bg-light-border/50'}`}>
            {[
              { id: 'upload', label: 'PDF Upload', icon: Icons.upload },
              { id: 'search', label: 'manage2sail', icon: Icons.search },
              { id: 'manual', label: 'Manuell', icon: Icons.edit },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setAddMode(mode.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${addMode === mode.id
                  ? isDark ? 'bg-navy-700 text-cream' : 'bg-white text-light-text shadow-sm'
                  : isDark ? 'text-cream/50 hover:text-cream' : 'text-light-muted hover:text-light-text'
                  }`}
              >
                <span className="w-4 h-4">{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Upload Mode */}
          {addMode === 'upload' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => handleFileDrop(e, false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                  ? isDark ? 'border-gold-400 bg-gold-400/10' : 'border-teal-500 bg-teal-500/10'
                  : isDark ? 'border-navy-700 hover:border-gold-400/50' : 'border-light-border hover:border-teal-500/50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileDrop(e, false)}
                />
                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
                  }`}>
                  {pdfProcessing ? Icons.refresh : Icons.upload}
                </div>
                <p className={isDark ? 'text-cream' : 'text-light-text'}>
                  {pdfProcessing
                    ? ocrProgress?.status || 'Verarbeite PDF...'
                    : 'Ergebnis-PDF hier ablegen oder klicken'}
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
                  className={`flex-1 px-4 py-2 rounded-lg border ${isDark
                    ? 'bg-navy-800 border-navy-700 text-cream placeholder:text-cream/30'
                    : 'bg-white border-light-border text-light-text'
                    }`}
                />
                <Button onClick={searchManage2Sail} disabled={m2sSearching}>
                  {m2sSearching ? 'Suche...' : 'Suchen'}
                </Button>
              </div>

              {m2sError && (
                <p className="text-coral text-sm">{m2sError}</p>
              )}

              {m2sResults.length > 0 && (
                <div className="space-y-2">
                  {m2sResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => loadRegattaDetails(r)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${isDark ? 'bg-navy-800/50 hover:bg-navy-800' : 'bg-light-border/30 hover:bg-light-border'
                        }`}
                    >
                      <p className={`font-medium ${isDark ? 'text-cream' : 'text-light-text'}`}>
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
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
                  Regatta-Name *
                </label>
                <input
                  type="text"
                  value={regattaName}
                  onChange={(e) => setRegattaName(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark
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
                  className={`w-full px-4 py-2 rounded-lg border ${isDark
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
                  className={`w-full px-4 py-2 rounded-lg border ${isDark
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
                  className={`w-full px-4 py-2 rounded-lg border ${isDark
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
                  className={`w-full px-4 py-2 rounded-lg border ${isDark
                    ? 'bg-navy-800 border-navy-700 text-cream'
                    : 'bg-white border-light-border text-light-text'
                    }`}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(1)} disabled={!regattaName}>
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
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedCrew.find(c => c.id === member.id)
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
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-cream' : 'text-light-text'}`}>
            Rechnung
          </h3>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingInvoice(true); }}
            onDragLeave={() => setIsDraggingInvoice(false)}
            onDrop={(e) => handleFileDrop(e, true)}
            onClick={() => invoiceInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${isDraggingInvoice
              ? isDark ? 'border-gold-400 bg-gold-400/10' : 'border-teal-500 bg-teal-500/10'
              : isDark ? 'border-navy-700 hover:border-gold-400/50' : 'border-light-border hover:border-teal-500/50'
              }`}
          >
            <input
              ref={invoiceInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileDrop(e, true)}
            />
            <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${isDark ? 'bg-gold-400/10 text-gold-400' : 'bg-teal-500/10 text-teal-500'
              }`}>
              {invoiceProcessing ? Icons.refresh : Icons.receipt}
            </div>
            <p className={isDark ? 'text-cream' : 'text-light-text'}>
              {invoiceProcessing
                ? ocrProgress?.status || 'Verarbeite Rechnung...'
                : 'Rechnung hier ablegen oder klicken'}
            </p>
          </div>

          <div>
            <label className={`block text-sm mb-1 ${isDark ? 'text-cream/70' : 'text-light-muted'}`}>
              Rechnungsbetrag (€) *
            </label>
            <input
              type="text"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              placeholder="z.B. 45,00"
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-navy-800 border-navy-700 text-cream'
                : 'bg-white border-light-border text-light-text'
                }`}
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
