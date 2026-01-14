// Module configuration with dev and production URLs
const isDev = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost'
  : process.env.NODE_ENV === 'development';

// Dev ports for each module
const DEV_PORTS = {
  web: 3000,
  saisonplanung: 3020,
  startgelder: 3030,
  schadensmeldung: 3040,
  eventanmeldung: 3050,
  saisoncharter: 3060,
  jugendleistungsfonds: 3070,
  spendenportal: 3080,
  jahresauswertung: 3090,
};

// Get module URL (always use relative path since modules are integrated)
export const getModuleUrl = (moduleId) => {
  return `/${moduleId}/`;
};

// Get central dashboard URL (web app)
export const getCentralDashboardUrl = () => {
  if (isDev) {
    return `http://localhost:${DEV_PORTS.web}/dashboard`;
  }
  return '/dashboard';
};

// Module definitions
export const MODULES = {
  saisonplanung: {
    id: 'saisonplanung',
    title: 'Saisonplanung',
    description: 'Plane und verwalte Regatten, Trainingslager und Motorboot-Einsätze',
    get href() { return getModuleUrl('saisonplanung'); }
  },
  startgelder: {
    id: 'startgelder',
    title: 'Startgeld-Erstattung',
    description: 'Erfasse Regatta-Teilnahmen und erstelle Erstattungsanträge',
    get href() { return getModuleUrl('startgelder'); }
  },
  schadensmeldung: {
    id: 'schadensmeldung',
    title: 'Schadensmeldung',
    description: 'Melde Schäden an Booten und verfolge Reparaturen',
    get href() { return getModuleUrl('schadensmeldung'); }
  },
  eventanmeldung: {
    id: 'eventanmeldung',
    title: 'Eventanmeldung',
    description: 'Melde dich für Regatten und Trainingslager an',
    get href() { return getModuleUrl('eventanmeldung'); }
  },
  saisoncharter: {
    id: 'saisoncharter',
    title: 'Saison-Charter',
    description: 'Chartere ein Vereinsboot für die Saison',
    get href() { return getModuleUrl('saisoncharter'); }
  },
  jugendleistungsfonds: {
    id: 'jugendleistungsfonds',
    title: 'Jugendleistungsfonds',
    description: 'Beantrage finanzielle Unterstützung',
    get href() { return getModuleUrl('jugendleistungsfonds'); }
  },
  spendenportal: {
    id: 'spendenportal',
    title: 'Spendenportal',
    description: 'Unterstütze die TSC-Jugend mit einer Spende',
    get href() { return getModuleUrl('spendenportal'); }
  },
  jahresauswertung: {
    id: 'jahresauswertung',
    title: 'Jahresauswertung',
    description: 'Statistiken und Ranglisten der Jugendarbeit',
    get href() { return getModuleUrl('jahresauswertung'); }
  },
};

export default { MODULES, getModuleUrl, getCentralDashboardUrl, DEV_PORTS };
