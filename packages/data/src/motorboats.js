export const motorboats = [
  { id: 'tornado-rot', name: 'Tornado rot', priority: ['29er', 'j70'], description: 'Schnellstes Boot' },
  { id: 'tornado-grau', name: 'Tornado grau', priority: ['29er', 'j70'], description: 'Schnelles Boot' },
  { id: 'narwhal', name: 'Narwhal', priority: [], description: 'Keine Priorisierung' },
  { id: 'zodiac', name: 'Zodiac', priority: [], description: 'Keine Priorisierung' }
];

export const getMotorboat = (id) => motorboats.find(mb => mb.id === id);
export const getMotorboatName = (id) => getMotorboat(id)?.name || id;

// Prüft ob eine Bootsklasse Priorität auf ein Motorboot hat
export const hasPriority = (boatClassId, motorboatId) => {
  const motorboat = getMotorboat(motorboatId);
  return motorboat?.priority.includes(boatClassId) || false;
};

// Gibt die priorisierten Motorboote für eine Bootsklasse zurück
export const getPriorityMotorboats = (boatClassId) => {
  return motorboats.filter(mb => mb.priority.includes(boatClassId));
};

// Gibt alle Motorboote zurück, sortiert nach Priorität für eine Bootsklasse
export const getMotorboatsSortedByPriority = (boatClassId) => {
  return [...motorboats].sort((a, b) => {
    const aPriority = a.priority.includes(boatClassId) ? 0 : 1;
    const bPriority = b.priority.includes(boatClassId) ? 0 : 1;
    return aPriority - bPriority;
  });
};
