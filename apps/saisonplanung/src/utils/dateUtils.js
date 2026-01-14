// Datum formatieren (DD.MM.YYYY)
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Datum + Uhrzeit formatieren
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Zeitraum formatieren (z.B. "15. - 17. Juni 2025")
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${start.getDate()}. - ${end.getDate()}. ${start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
  } else if (sameYear) {
    return `${start.getDate()}. ${start.toLocaleDateString('de-DE', { month: 'long' })} - ${end.getDate()}. ${end.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
  } else {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
};

// Monat und Jahr (z.B. "Juni 2025")
export const formatMonthYear = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric'
  });
};

// Anzahl Tage zwischen zwei Daten
export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Prüfen ob Zeiträume überlappen
export const doDateRangesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 <= e2 && e1 >= s2;
};

// Alle Monate in einem Zeitraum
export const getMonthsInRange = (startDate, endDate) => {
  const months = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
      label: current.toLocaleDateString('de-DE', { month: 'short' }),
      fullLabel: current.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
      daysInMonth: new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

// Position eines Datums im Zeitraum (0-1)
export const getPositionInRange = (date, rangeStart, rangeEnd) => {
  const d = new Date(date).getTime();
  const start = new Date(rangeStart).getTime();
  const end = new Date(rangeEnd).getTime();
  return (d - start) / (end - start);
};
