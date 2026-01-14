export const boatClasses = [
  // Optimist - Jugend Einstieg (nach Leistungsgruppen)
  { id: 'opti-c', name: 'Opti C', color: '#22c55e', crewSize: 1, category: 'einhand' },
  { id: 'opti-b', name: 'Opti B', color: '#3b82f6', crewSize: 1, category: 'einhand' },
  { id: 'opti-a', name: 'Opti A', color: '#8b5cf6', crewSize: 1, category: 'einhand' },

  // Teeny - Kinder/Jugend Einstieg
  { id: 'teeny', name: 'Teeny', color: '#84cc16', crewSize: 1, category: 'einhand' },

  // O'pen Skiff - moderne Jugendklasse
  { id: 'open-skiff', name: "O'pen Skiff", color: '#14b8a6', crewSize: 1, category: 'einhand' },

  // Laser Bug - Kinder Einstieg
  { id: 'laser-bug', name: 'Laser Bug', color: '#a3e635', crewSize: 1, category: 'einhand' },

  // ILCA (ehemals Laser) - Einhand
  { id: 'ilca-4', name: 'ILCA 4', color: '#0ea5e9', crewSize: 1, category: 'einhand' },
  { id: 'ilca-6', name: 'ILCA 6', color: '#0284c7', crewSize: 1, category: 'einhand' },
  { id: 'ilca-7', name: 'ILCA 7', color: '#0369a1', crewSize: 1, category: 'einhand' },

  // Europe - Einhand
  { id: 'europe', name: 'Europe', color: '#6366f1', crewSize: 1, category: 'einhand' },

  // Finn Dinghy - Einhand (Männer Schwergewicht)
  { id: 'finn', name: 'Finn Dinghy', color: '#7c3aed', crewSize: 1, category: 'einhand' },

  // Zweihand Jollen - Jugend
  { id: 'cadet', name: 'Cadet', color: '#f472b6', crewSize: 2, category: 'zweihand' },
  { id: 'rs-feva', name: 'RS Feva', color: '#fb7185', crewSize: 2, category: 'zweihand' },
  { id: '420er', name: '420er', color: '#f97316', crewSize: 2, category: 'zweihand' },
  { id: 'pirat', name: 'Pirat', color: '#ec4899', crewSize: 2, category: 'zweihand' },

  // Skiff Klassen
  { id: '29er', name: '29er', color: '#f59e0b', crewSize: 2, category: 'skiff' },
  { id: '49er', name: '49er', color: '#eab308', crewSize: 2, category: 'skiff' },
  { id: '49er-fx', name: '49er FX', color: '#facc15', crewSize: 2, category: 'skiff' },

  // Olympische Zweihand
  { id: '470er', name: '470er', color: '#dc2626', crewSize: 2, category: 'zweihand' },

  // Kielboote
  { id: 'j70', name: 'J70', color: '#06b6d4', crewSize: 4, category: 'kielboot' },

  // Sonstige
  { id: 'sonstige', name: 'Sonstige', color: '#6b7280', crewSize: 1, category: 'sonstige' },
];

// Helper functions
export const getBoatClass = (id) => boatClasses.find(bc => bc.id === id);
export const getBoatClassName = (id) => getBoatClass(id)?.name || id;
export const getBoatClassColor = (id) => getBoatClass(id)?.color || '#6b7280';
export const getBoatClassCrewSize = (id) => getBoatClass(id)?.crewSize || 1;
export const getBoatClassCategory = (id) => getBoatClass(id)?.category || 'sonstige';

// Get boat classes by category
export const getBoatClassesByCategory = (category) =>
  boatClasses.filter(bc => bc.category === category);

// Categories for UI grouping
export const boatClassCategories = [
  { id: 'einhand', name: 'Einhand' },
  { id: 'zweihand', name: 'Zweihand' },
  { id: 'skiff', name: 'Skiff' },
  { id: 'kielboot', name: 'Kielboot' },
  { id: 'sonstige', name: 'Sonstige' },
];
