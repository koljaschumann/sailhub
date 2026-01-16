import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { boatClasses, getBoatClassName, getBoatClassColor, motorboats, getMotorboatName } from '@tsc/data';

// Deutsche Monatsnamen
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

// Datum formatieren
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

// Kurzes Datum (ohne Jahr)
const formatShortDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getDate()}.${date.getMonth() + 1}.`;
};

// Hex zu RGB konvertieren
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * PDF Export: Motorboot-Übersicht
 * Zeigt alle Motorboote mit ihren zugewiesenen Events
 */
export function exportMotorboatPlan(events, season) {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Motorboot-Einsatzplan', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(season.name, pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Erstellt am: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 28, { align: 'center' });

  let yPos = 38;

  // Für jedes Motorboot
  motorboats.forEach((mb, mbIndex) => {
    const boatEvents = events.filter(e => e.assignedMotorboat === mb.id)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Neues Motorboot - Header
    if (yPos > 170) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(41, 50, 65);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${mb.name} - ${mb.description}`, 18, yPos + 5.5);

    if (mb.priority.length > 0) {
      const priorityText = `Priorität: ${mb.priority.map(id => getBoatClassName(id)).join(', ')}`;
      doc.setFontSize(9);
      doc.text(priorityText, pageWidth - 18, yPos + 5.5, { align: 'right' });
    }

    doc.setTextColor(0, 0, 0);
    yPos += 12;

    if (boatEvents.length > 0) {
      // Tabelle für Events
      const tableData = boatEvents.map(event => {
        const boatClass = getBoatClassName(event.boatClassId);
        return [
          boatClass,
          event.type === 'regatta' ? 'Regatta' : 'Trainingslager',
          event.name,
          event.organizer || event.location || '-',
          `${formatShortDate(event.startDate)} - ${formatShortDate(event.endDate)}`,
          event.motorboatLoadingTime ? formatDate(event.motorboatLoadingTime.split('T')[0]) : '-'
        ];
      });

      doc.autoTable({
        startY: yPos,
        head: [['Bootsklasse', 'Typ', 'Name', 'Ort/Veranstalter', 'Zeitraum', 'Verladung']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 55 },
          3: { cellWidth: 50 },
          4: { cellWidth: 35 },
          5: { cellWidth: 25 }
        },
        margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
          // Bootsklassen-Farbe als Punkt
          if (data.column.index === 0 && data.section === 'body') {
            const event = boatEvents[data.row.index];
            const color = hexToRgb(getBoatClassColor(event.boatClassId));
            doc.setFillColor(color.r, color.g, color.b);
            doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 2, 'F');
          }
        }
      });

      yPos = doc.lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('Keine Einsätze geplant', 18, yPos + 4);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    }
  });

  // Footer auf allen Seiten
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Seite ${i} von ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.text('TSC-Jugendportal - Saisonplanung', 14, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`Motorboot-Plan_${season.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * PDF Export: Jahreskalender (Gesamtübersicht)
 * Zeigt alle Veranstaltungen in einer monatsweisen Kalenderansicht
 */
export function exportSeasonCalendar(events, season) {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Saisonübersicht - Jahreskalender', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(season.name, pageWidth / 2, 22, { align: 'center' });

  // Legende - nur Bootsklassen mit Einträgen anzeigen
  const usedBoatClassIds = [...new Set(events.map(e => e.boatClassId))];
  const usedBoatClasses = boatClasses.filter(bc => usedBoatClassIds.includes(bc.id));

  doc.setFontSize(8);
  let legendX = 14;
  usedBoatClasses.forEach((bc) => {
    const color = hexToRgb(bc.color);
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(legendX, 28, 4, 4, 'F');
    doc.text(bc.name, legendX + 6, 31);
    legendX += doc.getTextWidth(bc.name) + 12;
  });

  // Berechne Monate der Saison
  const startDate = new Date(season.start);
  const endDate = new Date(season.end);
  const months = [];

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (current <= endDate) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      name: MONTHS[current.getMonth()]
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Kalender-Grid Layout
  const marginLeft = 14;
  const marginTop = 40;
  const monthWidth = (pageWidth - 28) / Math.min(months.length, 7);
  const dayHeight = 18;
  const headerHeight = 8;

  // Maximal 7 Monate pro Zeile
  const rowCount = Math.ceil(months.length / 7);
  const rowHeight = 32 * dayHeight / 4 + headerHeight + 10;

  months.forEach((m, mIndex) => {
    const row = Math.floor(mIndex / 7);
    const col = mIndex % 7;

    // Neue Seite wenn nötig
    if (row > 0 && col === 0 && marginTop + row * rowHeight > pageHeight - 30) {
      doc.addPage();
    }

    const baseX = marginLeft + col * monthWidth;
    const baseY = marginTop + (row * rowHeight);

    // Monatsheader
    doc.setFillColor(41, 50, 65);
    doc.rect(baseX, baseY, monthWidth - 2, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${m.name} ${m.year}`, baseX + 3, baseY + 5.5);
    doc.setTextColor(0, 0, 0);

    // Events in diesem Monat finden
    const monthEvents = events.filter(e => {
      const eStart = new Date(e.startDate);
      const eEnd = new Date(e.endDate);
      const monthStart = new Date(m.year, m.month, 1);
      const monthEnd = new Date(m.year, m.month + 1, 0);
      return eStart <= monthEnd && eEnd >= monthStart;
    }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Events auflisten
    let eventY = baseY + headerHeight + 3;
    const maxEvents = 6;

    monthEvents.slice(0, maxEvents).forEach((event) => {
      const color = hexToRgb(getBoatClassColor(event.boatClassId));
      doc.setFillColor(color.r, color.g, color.b);
      doc.rect(baseX + 1, eventY - 2.5, 3, 3, 'F');

      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      const eventText = `${formatShortDate(event.startDate)} ${event.name}`;
      const maxWidth = monthWidth - 10;
      const truncated = eventText.length > 25 ? eventText.substring(0, 22) + '...' : eventText;
      doc.text(truncated, baseX + 5, eventY);
      eventY += 4;
    });

    if (monthEvents.length > maxEvents) {
      doc.setFontSize(6);
      doc.setTextColor(128, 128, 128);
      doc.text(`+${monthEvents.length - maxEvents} weitere`, baseX + 5, eventY);
      doc.setTextColor(0, 0, 0);
    }
  });

  // Tabelle mit allen Events
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Alle Veranstaltungen', pageWidth / 2, 15, { align: 'center' });

  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const tableData = sortedEvents.map(e => [
    `${formatShortDate(e.startDate)} - ${formatShortDate(e.endDate)}`,
    getBoatClassName(e.boatClassId),
    e.type === 'regatta' ? 'Regatta' : 'TL',
    e.name,
    e.organizer || e.location || '-',
    getMotorboatName(e.assignedMotorboat)
  ]);

  doc.autoTable({
    startY: 22,
    head: [['Zeitraum', 'Bootsklasse', 'Typ', 'Name', 'Ort/Veranstalter', 'Motorboot']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 50, 65], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15 },
      3: { cellWidth: 60 },
      4: { cellWidth: 50 },
      5: { cellWidth: 30 }
    },
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      if (data.column.index === 1 && data.section === 'body') {
        const event = sortedEvents[data.row.index];
        const color = hexToRgb(getBoatClassColor(event.boatClassId));
        doc.setFillColor(color.r, color.g, color.b);
        doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 2, 'F');
      }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Seite ${i} von ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('TSC-Jugendportal - Saisonplanung', 14, pageHeight - 10);
    doc.text(`Erstellt: ${formatDate(new Date().toISOString())}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  doc.save(`Saisonkalender_${season.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * PDF Export: Übersicht nach Bootsklassen
 * Separate Seite/Tabelle für jede Bootsklasse
 */
export function exportByBoatClass(events, season) {
  const doc = new jsPDF('portrait');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Titelseite
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Saisonplanung', pageWidth / 2, 60, { align: 'center' });

  doc.setFontSize(18);
  doc.text('nach Bootsklassen', pageWidth / 2, 72, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(season.name, pageWidth / 2, 90, { align: 'center' });

  // Nur Bootsklassen mit Einträgen anzeigen
  const usedBoatClassIds = [...new Set(events.map(e => e.boatClassId))];
  const usedBoatClasses = boatClasses.filter(bc => usedBoatClassIds.includes(bc.id));

  // Übersicht auf Titelseite
  doc.setFontSize(11);
  let summaryY = 120;
  doc.text('Übersicht:', 14, summaryY);
  summaryY += 10;

  usedBoatClasses.forEach((bc) => {
    const count = events.filter(e => e.boatClassId === bc.id).length;
    const regattas = events.filter(e => e.boatClassId === bc.id && e.type === 'regatta').length;
    const camps = events.filter(e => e.boatClassId === bc.id && e.type === 'trainingslager').length;

    const color = hexToRgb(bc.color);
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(14, summaryY - 4, 6, 6, 'F');
    doc.text(`${bc.name}: ${count} Veranstaltungen (${regattas} Regatten, ${camps} Trainingslager)`, 24, summaryY);
    summaryY += 8;
  });

  doc.setFontSize(9);
  doc.text(`Erstellt am: ${formatDate(new Date().toISOString())}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

  // Für jede Bootsklasse mit Einträgen eine Seite
  usedBoatClasses.forEach((bc) => {
    const classEvents = events.filter(e => e.boatClassId === bc.id)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    doc.addPage();

    // Header mit Bootsklassen-Farbe
    const color = hexToRgb(bc.color);
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(bc.name, pageWidth / 2, 16, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${classEvents.length} Veranstaltungen | ${season.name}`, pageWidth / 2, 32, { align: 'center' });

    if (classEvents.length > 0) {
      // Regatten
      const regattas = classEvents.filter(e => e.type === 'regatta');
      if (regattas.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Regatten', 14, 45);

        const regattaData = regattas.map(e => [
          `${formatDate(e.startDate)} - ${formatDate(e.endDate)}`,
          e.name,
          e.organizer || '-',
          getMotorboatName(e.assignedMotorboat)
        ]);

        doc.autoTable({
          startY: 50,
          head: [['Zeitraum', 'Name', 'Veranstalter', 'Motorboot']],
          body: regattaData,
          theme: 'striped',
          headStyles: { fillColor: [color.r, color.g, color.b], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
      }

      // Trainingslager
      const camps = classEvents.filter(e => e.type === 'trainingslager');
      if (camps.length > 0) {
        const startY = regattas.length > 0 ? doc.lastAutoTable.finalY + 15 : 45;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Trainingslager', 14, startY);

        const campData = camps.map(e => [
          `${formatDate(e.startDate)} - ${formatDate(e.endDate)}`,
          e.name,
          e.location || '-',
          getMotorboatName(e.assignedMotorboat)
        ]);

        doc.autoTable({
          startY: startY + 5,
          head: [['Zeitraum', 'Name', 'Ort', 'Motorboot']],
          body: campData,
          theme: 'striped',
          headStyles: { fillColor: [color.r, color.g, color.b], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
      }

      // Motorboot-Zusammenfassung
      const motorboatUsage = {};
      classEvents.forEach(e => {
        const mbName = getMotorboatName(e.assignedMotorboat);
        motorboatUsage[mbName] = (motorboatUsage[mbName] || 0) + 1;
      });

      const finalY = doc.lastAutoTable?.finalY || 100;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Motorboot-Nutzung:', 14, finalY + 15);

      doc.setFont('helvetica', 'normal');
      let mbY = finalY + 22;
      Object.entries(motorboatUsage).forEach(([name, count]) => {
        doc.text(`${name}: ${count}x`, 20, mbY);
        mbY += 6;
      });
    }
  });

  // Footer auf allen Seiten
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Seite ${i} von ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    if (i > 1) {
      doc.text('TSC-Jugendportal - Saisonplanung', 14, pageHeight - 10);
    }
  }

  doc.save(`Bootsklassen_${season.name.replace(/\s+/g, '_')}.pdf`);
}
