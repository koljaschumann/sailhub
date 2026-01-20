import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// PDF.js Worker Setup
const setupPdfWorker = () => {
  const version = pdfjsLib.version || '3.11.174';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
};
setupPdfWorker();

/**
 * Führt OCR auf einem PDF durch
 */
export async function performOCR(pdfData, onProgress) {
  try {
    if (onProgress) onProgress({ status: 'OCR wird gestartet...' });

    const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
    const pdf = await loadingTask.promise;

    let fullText = '';
    console.log(`OCR: PDF hat ${pdf.numPages} Seiten`);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (onProgress) onProgress({ status: `OCR Seite ${pageNum} von ${pdf.numPages}...` });

      const page = await pdf.getPage(pageNum);
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      if (onProgress) onProgress({ status: `Texterkennung Seite ${pageNum}/${pdf.numPages}...` });

      const result = await Tesseract.recognize(canvas, 'deu+eng', {
        logger: m => {
          if (m.status === 'recognizing text' && onProgress) {
            const pageProgress = ((pageNum - 1) / pdf.numPages + m.progress / pdf.numPages) * 100;
            onProgress({ status: `Seite ${pageNum}/${pdf.numPages}: ${Math.round(m.progress * 100)}%` });
          }
        }
      });

      fullText += result.data.text + '\n--- Seite ' + pageNum + ' Ende ---\n';
    }

    console.log('OCR komplett, Text-Länge:', fullText.length);
    return fullText;
  } catch (err) {
    console.error('OCR Error:', err);
    return null;
  }
}

/**
 * Extrahiert Text direkt aus einem PDF
 */
export async function extractTextFromPDF(pdfData) {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData) });
    const pdf = await loadingTask.promise;
    let fullText = '';

    console.log(`PDF hat ${pdf.numPages} Seiten`);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Sortiere Items nach Y-Position (von oben nach unten)
      const items = content.items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 5) return yDiff;
        return a.transform[4] - b.transform[4];
      });

      let lastY = null;
      let pageText = '';

      for (const item of items) {
        const currentY = Math.round(item.transform[5]);

        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (lastY !== null) {
          pageText += ' ';
        }

        pageText += item.str;
        lastY = currentY;
      }

      fullText += pageText + '\n--- Seite ' + i + ' Ende ---\n';
    }

    console.log('Extrahierter Text (erste 1000 Zeichen):', fullText.slice(0, 1000));
    return fullText;
  } catch (err) {
    console.error('PDF extraction error:', err);
    return null;
  }
}

/**
 * Parst ein Regatta-Ergebnis-PDF
 * Akzeptiert entweder base64-Daten ODER bereits extrahierten Text
 */
export async function parseRegattaPDF(input, sailNumber, boatData = {}) {
  console.log('=== PARSING START ===');
  console.log('Segelnummer:', sailNumber);
  console.log('Input-Länge:', input?.length);

  // Prüfe ob Input base64 oder Text ist
  // base64 enthält keine Zeilenumbrüche und besteht aus base64-Zeichen
  let text = input;
  const looksLikeBase64 = input && input.length > 100 && !input.includes('\n') && /^[A-Za-z0-9+/=]+$/.test(input.slice(0, 100));

  if (looksLikeBase64) {
    console.log('Input scheint base64 zu sein, extrahiere Text...');
    text = await extractTextFromPDF(input);
    if (!text) {
      console.log('Text-Extraktion fehlgeschlagen, versuche OCR...');
      text = await performOCR(input);
    }
  }

  console.log('Text-Länge nach Extraktion:', text?.length);

  const result = {
    success: false,
    regattaName: '',
    boatClass: '',
    date: '',
    raceCount: 0,
    totalParticipants: 0,
    participant: null,
    allResults: [],
    feedback: null,
    confidence: 'low',
    crew: null
  };

  if (!text || !sailNumber) {
    result.feedback = 'Kein Text oder keine Segelnummer vorhanden';
    return result;
  }

  try {
    // Normalisiere die gesuchte Segelnummer
    const sailNumberOnly = sailNumber.replace(/[^0-9]/g, '');
    const normalizedSail = sailNumber.replace(/\s+/g, '').toUpperCase();
    console.log('Suche Segelnummer:', normalizedSail, 'Nur Ziffern:', sailNumberOnly);

    // Format-Erkennung
    const isManage2Sail = text.includes('manage2sail') || text.includes('Manage2Sail') ||
      text.includes('Final Overall Results') || text.includes('Discard rule');
    const hasBugNr = /bug\.?\s*nr|startnr|start\.?\s*nr/i.test(text);
    const hasRankColumn = /\bRk\.|\bRang\b|\bPlatz\b|\bPos\b/i.test(text);

    console.log('Format-Erkennung:', { isManage2Sail, hasBugNr, hasRankColumn });

    // Regatta-Name extrahieren
    let regattaName = null;
    const namePatterns = [
      /([A-Za-zäöüÄÖÜß\-]+(?:[\s\-][A-Za-zäöüÄÖÜß\-]+)*[\s\-]*(?:Preis|Pokal|Cup|Trophy|Regatta|Festival|Meisterschaft)[\s\-]*\d{4})/i,
      /([A-Za-zäöüÄÖÜß\-]+(?:pokal|cup|preis|trophy|regatta|meisterschaft))/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 5 && match[1].length < 60) {
        regattaName = match[1].trim();
        break;
      }
    }

    // Fallback: Suche nach Zeilen die wie Titel aussehen
    if (!regattaName) {
      const lines = text.split(/[\n\r]+/);
      for (const line of lines.slice(0, 10)) {
        const clean = line.trim();
        if (clean.length > 8 && clean.length < 50 &&
          !clean.includes('http') && !clean.includes('Seite') &&
          !/^\d+\s*$/.test(clean) && !/^Nr\.?\s/i.test(clean)) {
          regattaName = clean;
          break;
        }
      }
    }

    result.regattaName = regattaName || 'Regatta';

    // Bootsklasse erkennen
    const classMatch = text.match(/(Optimist\s*[AB]?|ILCA\s*[467]|Laser|420er?|470er?|29er|49er|Europe|Finn|OK[\-\s]?Jolle|Pirat|Korsar|O'pen\s*Skiff|Open\s*Skiff)/i);
    if (classMatch) {
      result.boatClass = classMatch[1].trim();
    }

    // Datum extrahieren
    const monthsMap = {
      'JAN': '01', 'JANUAR': '01', 'FEB': '02', 'FEBRUAR': '02',
      'MÄR': '03', 'MAR': '03', 'MÄRZ': '03', 'MAERZ': '03',
      'APR': '04', 'APRIL': '04', 'MAI': '05', 'MAY': '05',
      'JUN': '06', 'JUNI': '06', 'JUNE': '06', 'JUL': '07', 'JULI': '07', 'JULY': '07',
      'AUG': '08', 'AUGUST': '08', 'SEP': '09', 'SEPT': '09', 'SEPTEMBER': '09',
      'OKT': '10', 'OCT': '10', 'OKTOBER': '10', 'OCTOBER': '10',
      'NOV': '11', 'NOVEMBER': '11', 'DEZ': '12', 'DEC': '12', 'DEZEMBER': '12', 'DECEMBER': '12'
    };

    const textDateMatch = text.match(/(\d{1,2})[\.\s\-\/]*(JAN(?:UAR)?|FEB(?:RUAR)?|MÄR(?:Z)?|MAR(?:CH)?|MAERZ|APR(?:IL)?|MAI|MAY|JUN(?:I|E)?|JUL(?:I|Y)?|AUG(?:UST)?|SEP(?:T(?:EMBER)?)?|OKT(?:OBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEZ(?:EMBER)?|DEC(?:EMBER)?)[\.\s\-\/]*(\d{4})/i);

    if (textDateMatch) {
      const day = textDateMatch[1].padStart(2, '0');
      const monthKey = textDateMatch[2].toUpperCase();
      const year = textDateMatch[3];
      const month = monthsMap[monthKey] || '01';
      result.date = `${year}-${month}-${day}`;
    } else {
      const numDateMatch = text.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/);
      if (numDateMatch) {
        const day = numDateMatch[1].padStart(2, '0');
        const month = numDateMatch[2].padStart(2, '0');
        let year = numDateMatch[3];
        if (year.length === 2) year = '20' + year;
        result.date = `${year}-${month}-${day}`;
      }
    }

    // Wettfahrten zählen
    const raceMatches = text.match(/\bR(\d+)\b/gi) || text.match(/\bWF\s*(\d+)\b/gi);
    if (raceMatches) {
      const nums = [...new Set(raceMatches.map(r => parseInt(r.replace(/\D/g, ''))))].filter(n => n > 0 && n < 20);
      result.raceCount = nums.length > 0 ? Math.max(...nums) : 0;
    }

    // Alle Teilnehmer finden und Platzierung suchen
    const allParticipants = [];
    const lines = text.split(/[\n\r]+/);

    // Finde die Zeile mit der gesuchten Segelnummer
    let sailNumberLine = null;
    let sailNumberLineIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(sailNumberOnly) || line.toUpperCase().includes(normalizedSail)) {
        sailNumberLine = line;
        sailNumberLineIndex = i;
        console.log('Gefunden in Zeile', i, ':', line.slice(0, 120));
        break;
      }
    }

    // Spaltenstruktur analysieren
    let rankColumnIndex = 0;

    for (const line of lines.slice(0, 20)) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('nr.') || lowerLine.includes('rang') || lowerLine.includes('platz') || lowerLine.includes('rk.')) {
        const columns = line.split(/\s{2,}|\t/);
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i].toLowerCase().trim();
          if ((col === 'nr.' || col === 'nr' || col.includes('rang') || col.includes('platz') || col === 'rk.')
            && !col.includes('bug') && !col.includes('start') && !col.includes('segel')) {
            rankColumnIndex = i;
            break;
          }
        }
        break;
      }
    }

    // Platzierung extrahieren
    if (sailNumberLine) {
      const allNumbers = [];
      const numberPattern = /\b(\d{1,4})\b/g;
      let match;

      while ((match = numberPattern.exec(sailNumberLine)) !== null) {
        const sailPos = sailNumberLine.indexOf(sailNumberOnly);
        if (match.index < sailPos) {
          allNumbers.push({
            value: parseInt(match[1]),
            index: match.index,
            position: allNumbers.length
          });
        }
      }

      console.log('Zahlen vor Segelnummer:', allNumbers);

      let rank = null;

      if (allNumbers.length > 0) {
        if (hasBugNr && allNumbers.length >= 2) {
          rank = allNumbers[0].value;
        } else if (allNumbers.length === 1) {
          rank = allNumbers[0].value;
        } else {
          rank = allNumbers[rankColumnIndex]?.value || allNumbers[0].value;
        }
      }

      if (rank && rank > 500) {
        console.log('Rang unplausibel hoch:', rank, '- verwerfe');
        rank = null;
      }

      if (rank) {
        result.participant = {
          rank,
          sailNumber: normalizedSail,
          name: boatData.seglername || '',
        };
        result.success = true;
        result.confidence = allNumbers.length === 1 ? 'high' : 'medium';

        // Crew-Extraktion für Mehrpersonenboote
        const extractCrew = (searchText) => {
          const slashPattern = /([A-ZÄÖÜa-zäöüß]+\s+[A-ZÄÖÜ][A-ZÄÖÜa-zäöüß]+)\s*[\/\|]\s*([A-ZÄÖÜa-zäöüß]+\s+[A-ZÄÖÜ][A-ZÄÖÜa-zäöüß]+)/;
          const slashMatch = searchText.match(slashPattern);
          if (slashMatch) return slashMatch[2].trim();

          const crewLabelPattern = /(?:Crew|Vorschoter|Crewmitglied|Partner)[:\s]+([A-ZÄÖÜa-zäöüß]+\s+[A-ZÄÖÜ][A-ZÄÖÜa-zäöüß]+)/i;
          const crewLabelMatch = searchText.match(crewLabelPattern);
          if (crewLabelMatch) return crewLabelMatch[1].trim();

          return null;
        };

        let crewName = extractCrew(sailNumberLine);

        if (!crewName && sailNumberLineIndex >= 0 && sailNumberLineIndex < lines.length - 1) {
          const nextLine = lines[sailNumberLineIndex + 1];
          if (!/^\s*\d{1,3}\s/.test(nextLine)) {
            crewName = extractCrew(nextLine);
          }
        }

        if (crewName) {
          result.crew = crewName;
          console.log('Crew gefunden:', crewName);
        }
      }
    }

    // Alle Teilnehmer zählen
    for (const line of lines) {
      if (hasBugNr) {
        const bugNrMatch = line.match(/^\s*(\d{1,3})\s+\d+\s+(?:[A-Z]{2,3}\s*)?(\d{4,6})\b/);
        if (bugNrMatch) {
          const rank = parseInt(bugNrMatch[1]);
          if (rank > 0 && rank <= 300) {
            const sailNum = 'GER' + bugNrMatch[2];
            if (!allParticipants.find(p => p.sailNumber === sailNum)) {
              allParticipants.push({ rank, sailNumber: sailNum });
            }
          }
        }
      } else {
        const participantMatch = line.match(/^\s*(\d{1,3})\s+.*?(?:([A-Z]{2,3})\s*)?(\d{4,6})\b/);
        if (participantMatch) {
          const rank = parseInt(participantMatch[1]);
          if (rank > 0 && rank <= 300) {
            const sailNum = (participantMatch[2] || 'GER') + participantMatch[3];
            if (!allParticipants.find(p => p.sailNumber === sailNum)) {
              allParticipants.push({ rank, sailNumber: sailNum });
            }
          }
        }
      }
    }

    console.log('Gefundene Teilnehmer:', allParticipants.length);

    if (allParticipants.length > 0) {
      allParticipants.sort((a, b) => a.rank - b.rank);
      const rankCounts = {};
      allParticipants.forEach(p => rankCounts[p.rank] = (rankCounts[p.rank] || 0) + 1);

      let maxUniqueRank = 0;
      for (const [rank, count] of Object.entries(rankCounts)) {
        if (count === 1 && parseInt(rank) > maxUniqueRank) {
          maxUniqueRank = parseInt(rank);
        }
      }

      result.totalParticipants = maxUniqueRank || Math.max(...allParticipants.map(p => p.rank));
      result.allResults = allParticipants;
    }

    // Explizite Teilnehmeranzahl im Text suchen
    const entriesMatch = text.match(/(\d+)\s*(?:Entries|Teilnehmer|Meldungen|Boote|entries|teilnehmer)/i);
    if (entriesMatch && (!result.totalParticipants || result.totalParticipants === 0)) {
      const explicitCount = parseInt(entriesMatch[1]);
      if (explicitCount > 0 && explicitCount < 500) {
        result.totalParticipants = explicitCount;
      }
    }

    // Plausibilitätsprüfung
    if (result.participant && result.totalParticipants > 0) {
      if (result.participant.rank > result.totalParticipants) {
        result.feedback = `Bitte prüfen: Platz ${result.participant.rank} bei ${result.totalParticipants} Teilnehmern?`;
        result.confidence = 'low';
      } else {
        result.confidence = 'high';
      }
    }

    // Fallback
    if (!result.participant && sailNumberLine) {
      const firstNumberMatch = sailNumberLine.match(/^\s*(\d{1,3})\b/);
      if (firstNumberMatch) {
        const rank = parseInt(firstNumberMatch[1]);
        if (rank > 0 && rank <= 300) {
          result.participant = {
            rank,
            sailNumber: normalizedSail,
            name: boatData.seglername || '',
          };
          result.success = true;
          result.confidence = 'medium';
        }
      }
    }

    if (!result.regattaName || result.regattaName.length < 3) {
      result.regattaName = result.boatClass
        ? `Regatta (${result.boatClass})`
        : `Regatta vom ${new Date().toLocaleDateString('de-DE')}`;
    }

    if (!result.participant) {
      result.feedback = `Segelnummer "${sailNumber}" nicht gefunden. `;
      if (text.includes(sailNumberOnly)) {
        result.feedback += 'Die Ziffern wurden im Text gefunden - bitte manuell korrigieren.';
      }
    }

    console.log('=== PARSING ERGEBNIS ===');
    console.log('Regatta:', result.regattaName);
    console.log('Platzierung:', result.participant?.rank, '(Konfidenz:', result.confidence + ')');
    console.log('Teilnehmer:', result.totalParticipants);
    console.log('Wettfahrten:', result.raceCount);

  } catch (err) {
    console.error('Parse error:', err);
    result.feedback = 'Fehler beim Parsen: ' + err.message;
  }

  // Füge placement als Alias für participant.rank hinzu (für Kompatibilität)
  if (result.participant?.rank) {
    result.placement = result.participant.rank;
  }

  return result;
}

/**
 * Extrahiert den Rechnungsbetrag aus einer Rechnung
 */
export async function parseInvoicePDF(pdfData, onProgress) {
  try {
    let text = await extractTextFromPDF(pdfData);
    if (!text || text.length < 100) {
      text = await performOCR(pdfData, onProgress);
    }

    if (text) {
      const amountPatterns = [
        /(\d{1,3}[.,]\d{2})\s*€/g,
        /€\s*(\d{1,3}[.,]\d{2})/g,
        /EUR\s*(\d{1,3}[.,]\d{2})/gi,
        /betrag[:\s]*(\d{1,3}[.,]\d{2})/gi,
        /summe[:\s]*(\d{1,3}[.,]\d{2})/gi,
        /gesamt[:\s]*(\d{1,3}[.,]\d{2})/gi,
      ];

      let amounts = [];
      for (const pattern of amountPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const amount = parseFloat(match[1].replace(',', '.'));
          if (amount > 5 && amount < 500) {
            amounts.push(amount);
          }
        }
      }

      if (amounts.length > 0) {
        return Math.max(...amounts);
      }
    }

    return null;
  } catch (err) {
    console.error('Invoice Processing Error:', err);
    return null;
  }
}
