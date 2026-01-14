import { motorboats, hasPriority } from '@tsc/data';
import { doDateRangesOverlap } from './dateUtils';

/**
 * Findet alle Konflikte in der Motorboot-Planung
 * @param {Array} events - Alle Events
 * @returns {Array} - Array von Konflikten
 */
export function findConflicts(events) {
  const conflicts = [];

  // Gruppiere Events nach zugewiesenem Motorboot
  const eventsByMotorboat = {};
  motorboats.forEach(mb => {
    eventsByMotorboat[mb.id] = events.filter(e => e.assignedMotorboat === mb.id);
  });

  // Prüfe Überlappungen pro Motorboot
  motorboats.forEach(mb => {
    const boatEvents = eventsByMotorboat[mb.id] || [];

    for (let i = 0; i < boatEvents.length; i++) {
      for (let j = i + 1; j < boatEvents.length; j++) {
        const event1 = boatEvents[i];
        const event2 = boatEvents[j];

        // Prüfe ob Zeiträume überlappen (inkl. Verladung)
        const overlap = doDateRangesOverlap(
          event1.motorboatLoadingTime?.split('T')[0] || event1.startDate,
          event1.endDate,
          event2.motorboatLoadingTime?.split('T')[0] || event2.startDate,
          event2.endDate
        );

        if (overlap) {
          conflicts.push({
            id: `${event1.id}-${event2.id}`,
            motorboatId: mb.id,
            events: [event1, event2],
            type: 'overlap',
            suggestion: generateSuggestion(event1, event2, mb.id)
          });
        }
      }
    }
  });

  return conflicts;
}

/**
 * Generiert einen Lösungsvorschlag für einen Konflikt
 */
function generateSuggestion(event1, event2, motorboatId) {
  const mb = motorboats.find(m => m.id === motorboatId);

  // Prüfe Prioritäten
  const e1HasPriority = hasPriority(event1.boatClassId, motorboatId);
  const e2HasPriority = hasPriority(event2.boatClassId, motorboatId);

  // Finde alternative Boote
  const alternativeBoats = motorboats.filter(m => m.id !== motorboatId);

  if (e1HasPriority && !e2HasPriority) {
    // Event1 behält Boot, Event2 bekommt Alternative
    const altBoat = findBestAlternative(event2.boatClassId, alternativeBoats);
    return {
      keepEvent: event1.id,
      moveEvent: event2.id,
      newMotorboat: altBoat?.id,
      reason: `${event1.boatClassId} hat Priorität auf ${mb?.name}`
    };
  }

  if (!e1HasPriority && e2HasPriority) {
    // Event2 behält Boot, Event1 bekommt Alternative
    const altBoat = findBestAlternative(event1.boatClassId, alternativeBoats);
    return {
      keepEvent: event2.id,
      moveEvent: event1.id,
      newMotorboat: altBoat?.id,
      reason: `${event2.boatClassId} hat Priorität auf ${mb?.name}`
    };
  }

  if (e1HasPriority && e2HasPriority) {
    // Beide haben Priorität (29er vs J70) - einer bekommt anderes Tornado
    const otherTornado = alternativeBoats.find(m => m.id.includes('tornado'));
    if (otherTornado) {
      return {
        keepEvent: event1.id,
        moveEvent: event2.id,
        newMotorboat: otherTornado.id,
        reason: `Beide Klassen haben Priorität - ${event2.boatClassId} erhält ${otherTornado.name}`
      };
    }
  }

  // Keine Prioritäten - First-Come-First-Serve (nach Erstellungsdatum)
  const earlier = new Date(event1.createdAt) < new Date(event2.createdAt) ? event1 : event2;
  const later = earlier === event1 ? event2 : event1;
  const altBoat = findBestAlternative(later.boatClassId, alternativeBoats);

  return {
    keepEvent: earlier.id,
    moveEvent: later.id,
    newMotorboat: altBoat?.id,
    reason: 'Keine Priorität - frühere Buchung behält Boot'
  };
}

/**
 * Findet das beste alternative Motorboot für eine Bootsklasse
 */
function findBestAlternative(boatClassId, availableBoats) {
  // Erst priorisierte Boote
  const prioritized = availableBoats.filter(mb => hasPriority(boatClassId, mb.id));
  if (prioritized.length > 0) return prioritized[0];

  // Dann andere Tornados
  const tornados = availableBoats.filter(mb => mb.id.includes('tornado'));
  if (tornados.length > 0) return tornados[0];

  // Dann restliche Boote
  return availableBoats[0];
}

/**
 * Wendet einen Lösungsvorschlag an
 */
export function applySuggestion(events, conflict, updateEvent) {
  const { suggestion } = conflict;
  if (suggestion?.moveEvent && suggestion?.newMotorboat) {
    updateEvent(suggestion.moveEvent, { assignedMotorboat: suggestion.newMotorboat });
    return true;
  }
  return false;
}

/**
 * Automatische Konfliktauflösung für alle Konflikte
 */
export function autoResolveConflicts(events, updateEvent) {
  let resolved = 0;
  let conflicts = findConflicts(events);

  while (conflicts.length > 0) {
    const conflict = conflicts[0];
    if (applySuggestion(events, conflict, updateEvent)) {
      resolved++;
    }
    // Neu berechnen nach Änderung
    conflicts = findConflicts(events);

    // Sicherheit: Max 100 Iterationen
    if (resolved > 100) break;
  }

  return resolved;
}

/**
 * Gibt Motorboot-Auslastung zurück
 */
export function getMotorboatUsage(events) {
  const usage = {};

  motorboats.forEach(mb => {
    const boatEvents = events.filter(e => e.assignedMotorboat === mb.id);
    usage[mb.id] = {
      motorboat: mb,
      events: boatEvents,
      count: boatEvents.length
    };
  });

  return usage;
}
