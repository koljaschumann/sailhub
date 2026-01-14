import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Exportiert die Regatta-Zusammenfassung als PDF
 */
export function exportSummaryPDF(regatten, boatData, season) {
  const doc = new jsPDF();
  const totalAmount = regatten.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0);

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Startgeld-Erstattung', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Saison ${season}`, 105, 28, { align: 'center' });

  // Segler-Info
  doc.setFontSize(11);
  doc.text(`Segler/in: ${boatData.seglername || '-'}`, 20, 45);
  doc.text(`Segelnummer: ${boatData.segelnummer || '-'}`, 20, 52);
  doc.text(`Bootsklasse: ${boatData.bootsklasse || '-'}`, 20, 59);

  // Bankverbindung
  doc.text('Bankverbindung:', 120, 45);
  doc.text(`IBAN: ${boatData.iban || '-'}`, 120, 52);
  doc.text(`Kontoinhaber: ${boatData.kontoinhaber || boatData.seglername || '-'}`, 120, 59);

  // Tabelle
  const tableData = regatten.map((r, i) => [
    i + 1,
    r.regattaName || '-',
    r.date || '-',
    `${r.placement || '-'}. / ${r.totalParticipants || '-'}`,
    r.raceCount || '-',
    r.crew?.map(c => c.name).join(', ') || '-',
    `${(r.invoiceAmount || 0).toFixed(2)} €`
  ]);

  doc.autoTable({
    startY: 70,
    head: [['Nr', 'Regatta', 'Datum', 'Platz.', 'WF', 'Crew', 'Betrag']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 33, 64],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [240, 245, 250] },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 50 },
      2: { cellWidth: 22 },
      3: { cellWidth: 20 },
      4: { cellWidth: 12 },
      5: { cellWidth: 45 },
      6: { cellWidth: 20 },
    }
  });

  // Summe
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Gesamtbetrag: ${totalAmount.toFixed(2)} €`, 20, finalY);

  // Unterschrift
  doc.setFont('helvetica', 'normal');
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, finalY + 20);
  doc.line(110, finalY + 20, 190, finalY + 20);
  doc.text('Unterschrift', 150, finalY + 25, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.text('Erstellt mit TSC Startgeld App', 105, 285, { align: 'center' });

  return doc;
}

export function downloadSummaryPDF(regatten, boatData, season) {
  const doc = exportSummaryPDF(regatten, boatData, season);
  doc.save(`Startgeld_${season}_${boatData.seglername || 'Antrag'}.pdf`);
}

/**
 * Erstellt ein PDF-ArrayBuffer für Email-Anhänge
 */
export async function createSummaryPDFBuffer(regatten, boatData, season) {
  const doc = exportSummaryPDF(regatten, boatData, season);
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

/**
 * Exportiert die Statistiken als PDF
 */
export function exportStatsPDF(regatten, boatData, season, stats) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Saison-Statistik', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${boatData.seglername} - Saison ${season}`, 105, 28, { align: 'center' });

  // Stats Boxes
  let y = 45;
  const statItems = [
    { label: 'Anzahl Regatten', value: stats.totalRegatten.toString() },
    { label: 'Gesamtbetrag', value: `${stats.totalAmount.toFixed(2)} €` },
    { label: 'Beste Platzierung', value: stats.bestPlacement ? `${stats.bestPlacement}. Platz` : '-' },
    { label: 'Durchschnitt', value: stats.avgPlacement ? `${stats.avgPlacement}. Platz` : '-' },
    { label: 'Wettfahrten gesamt', value: stats.totalRaces.toString() },
  ];

  statItems.forEach(stat => {
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label + ':', 20, y);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, 100, y);
    y += 10;
  });

  // Regatta-Übersicht
  y += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Regatta-Übersicht', 20, y);

  const tableData = regatten
    .sort((a, b) => (a.placement || 999) - (b.placement || 999))
    .map(r => [
      r.regattaName,
      r.date || '-',
      `${r.placement || '-'}. / ${r.totalParticipants || '-'}`,
      `${(r.invoiceAmount || 0).toFixed(2)} €`
    ]);

  doc.autoTable({
    startY: y + 5,
    head: [['Regatta', 'Datum', 'Platzierung', 'Betrag']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 33, 64],
      textColor: 255,
    },
  });

  doc.setFontSize(8);
  doc.text('Erstellt mit TSC Startgeld App', 105, 285, { align: 'center' });

  doc.save(`Statistik_${season}_${boatData.seglername || 'Export'}.pdf`);
}

/**
 * Exportiert als CSV
 */
export function exportCSV(regatten, boatData, season) {
  const headers = ['Nr', 'Regatta', 'Datum', 'Platzierung', 'Teilnehmer', 'Wettfahrten', 'Crew', 'Betrag'];
  const rows = regatten.map((r, i) => [
    i + 1,
    r.regattaName || '',
    r.date || '',
    r.placement || '',
    r.totalParticipants || '',
    r.raceCount || '',
    r.crew?.map(c => c.name).join('; ') || '',
    (r.invoiceAmount || 0).toFixed(2).replace('.', ',')
  ]);

  const csv = [
    `Startgeld-Erstattung Saison ${season}`,
    `Segler: ${boatData.seglername}`,
    `Segelnummer: ${boatData.segelnummer}`,
    '',
    headers.join(';'),
    ...rows.map(row => row.join(';')),
    '',
    `Gesamtbetrag: ${regatten.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0).toFixed(2).replace('.', ',')} EUR`
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Startgelder_${season}_${boatData.seglername || 'Export'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
