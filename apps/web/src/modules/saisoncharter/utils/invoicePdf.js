import { jsPDF } from 'jspdf';

/**
 * TSC Jugendabteilung Rechnungsdaten
 */
const INVOICE_SENDER = {
  name: 'Tegeler Segel-Club e.V.',
  department: 'Jugendabteilung',
  street: 'Schwarzer Weg 27',
  zip: '13505',
  city: 'Berlin',
  email: 'jugend@tegeler-segel-club.de',
  bankName: 'Berliner Sparkasse',
  iban: 'DE XX XXXX XXXX XXXX XXXX XX', // TODO: Echte IBAN eintragen
  bic: 'BELADEBEXXX',
};

/**
 * Formatiert ein Datum im deutschen Format
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatiert einen Betrag als Euro
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Generiert eine PDF-Rechnung für eine Charter-Buchung
 * @param {Object} invoice - Die Rechnungsdaten
 * @param {Object} booking - Die Buchungsdaten (mit boat und season)
 * @returns {jsPDF} Das PDF-Dokument
 */
export function generateInvoicePdf(invoice, booking) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // === HEADER ===
  // Absender (klein, oben)
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `${INVOICE_SENDER.name} · ${INVOICE_SENDER.department} · ${INVOICE_SENDER.street} · ${INVOICE_SENDER.zip} ${INVOICE_SENDER.city}`,
    margin,
    y
  );
  y += 15;

  // Empfänger
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(invoice.recipient_name, margin, y);
  y += 5;
  doc.text(invoice.recipient_email, margin, y);
  y += 20;

  // Rechnungstitel
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('RECHNUNG', margin, y);
  y += 10;

  // Rechnungsdetails rechts
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const detailsX = pageWidth - margin - 60;
  doc.text(`Rechnungsnummer: ${invoice.invoice_number}`, detailsX, y - 20);
  doc.text(`Rechnungsdatum: ${formatDate(invoice.created_at)}`, detailsX, y - 15);
  doc.text(`Fällig bis: ${formatDate(getDueDate(invoice.created_at))}`, detailsX, y - 10);

  y += 10;

  // Trennlinie
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // === BUCHUNGSDETAILS ===
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Saison-Charter', margin, y);
  y += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);

  const details = [
    ['Segler/in:', booking.sailor_name || '-'],
    ['Boot:', `${booking.boat?.name || '-'} (${booking.boat?.sail_number || '-'})`],
    ['Bootsklasse:', getBoatTypeLabel(booking.boat?.boat_type || booking.boat_class_id)],
    ['Saison:', `${booking.season?.year || '-'}`],
    ['Zeitraum:', `${formatDate(booking.season?.start_date)} - ${formatDate(booking.season?.end_date)}`],
    ['Verwendungszweck:', booking.charter_reason || '-'],
  ];

  details.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(value, margin + 40, y);
    y += 6;
  });

  y += 10;

  // === RECHNUNGSPOSITION ===
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');

  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('Beschreibung', margin + 2, y + 5.5);
  doc.text('Betrag', pageWidth - margin - 25, y + 5.5);
  y += 12;

  doc.setFont(undefined, 'normal');
  const description = `Charterpauschale ${booking.boat?.name || 'Boot'} - Saison ${booking.season?.year || ''}`;
  doc.text(description, margin + 2, y);
  doc.text(formatCurrency(invoice.amount), pageWidth - margin - 25, y);
  y += 8;

  // Trennlinie
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Summe
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Gesamtbetrag:', margin + 2, y);
  doc.text(formatCurrency(invoice.amount), pageWidth - margin - 25, y);
  y += 20;

  // === ZAHLUNGSHINWEIS ===
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf folgendes Konto:', margin, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text('Kontoinhaber:', margin, y);
  doc.setFont(undefined, 'normal');
  doc.text(INVOICE_SENDER.name, margin + 35, y);
  y += 5;

  doc.setFont(undefined, 'bold');
  doc.text('Bank:', margin, y);
  doc.setFont(undefined, 'normal');
  doc.text(INVOICE_SENDER.bankName, margin + 35, y);
  y += 5;

  doc.setFont(undefined, 'bold');
  doc.text('IBAN:', margin, y);
  doc.setFont(undefined, 'normal');
  doc.text(INVOICE_SENDER.iban, margin + 35, y);
  y += 5;

  doc.setFont(undefined, 'bold');
  doc.text('BIC:', margin, y);
  doc.setFont(undefined, 'normal');
  doc.text(INVOICE_SENDER.bic, margin + 35, y);
  y += 5;

  doc.setFont(undefined, 'bold');
  doc.text('Verwendungszweck:', margin, y);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.invoice_number, margin + 35, y);
  y += 20;

  // === FOOTER ===
  doc.setFontSize(8);
  doc.setTextColor(100);
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.text(
    `${INVOICE_SENDER.name} · ${INVOICE_SENDER.department}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    `${INVOICE_SENDER.street} · ${INVOICE_SENDER.zip} ${INVOICE_SENDER.city} · ${INVOICE_SENDER.email}`,
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  );

  return doc;
}

/**
 * Berechnet das Fälligkeitsdatum (14 Tage nach Rechnungsdatum)
 */
function getDueDate(createdAt) {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 14);
  return date.toISOString();
}

/**
 * Gibt das Label für einen Bootstyp zurück
 */
function getBoatTypeLabel(boatType) {
  const labels = {
    optimist: 'Optimist',
    ilca4: 'ILCA 4',
    ilca6: 'ILCA 6',
    '420er': '420er',
    '29er': '29er',
    laser: 'Laser',
  };
  return labels[boatType] || boatType || '-';
}

/**
 * Lädt die Rechnung als PDF herunter
 */
export function downloadInvoicePdf(invoice, booking) {
  const doc = generateInvoicePdf(invoice, booking);
  doc.save(`${invoice.invoice_number}.pdf`);
}

/**
 * Gibt die PDF als Blob zurück (für E-Mail-Versand)
 */
export function getInvoicePdfBlob(invoice, booking) {
  const doc = generateInvoicePdf(invoice, booking);
  return doc.output('blob');
}

/**
 * Gibt die PDF als Base64 zurück (für E-Mail-Versand)
 */
export function getInvoicePdfBase64(invoice, booking) {
  const doc = generateInvoicePdf(invoice, booking);
  return doc.output('datauristring').split(',')[1];
}

export default generateInvoicePdf;
