export const roles = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
  PARENT: 'eltern',
  SAILOR: 'segler'
};

export const roleLabels = {
  [roles.ADMIN]: 'Administrator',
  [roles.TRAINER]: 'Trainer:in',
  [roles.PARENT]: 'Elternteil',
  [roles.SAILOR]: 'Segler:in'
};

export const roleDescriptions = {
  [roles.ADMIN]: 'Vollzugriff auf alle Funktionen und Einstellungen',
  [roles.TRAINER]: 'Kann Events und Motorboote für zugewiesene Bootsklassen verwalten',
  [roles.PARENT]: 'Kann Startgeld-Erstattungen für eigene Kinder einreichen',
  [roles.SAILOR]: 'Mitglied der Jugendabteilung'
};

// Rollen für Registrierung (ohne Admin)
export const registrationRoles = [
  { value: roles.SAILOR, label: 'Mitglied der Jugendabteilung (Segler:in)' },
  { value: roles.TRAINER, label: 'Trainer:in' },
  { value: roles.PARENT, label: 'Elternteil' }
];

export const getRoleLabel = (role) => roleLabels[role] || role;
export const getRoleDescription = (role) => roleDescriptions[role] || '';

// Berechtigungsprüfungen
export const canManageEvents = (role) => role === roles.ADMIN || role === roles.TRAINER;
export const canManageMotorboats = (role) => role === roles.ADMIN;
export const canManageSeasons = (role) => role === roles.ADMIN;
export const canManageUsers = (role) => role === roles.ADMIN;
export const canSubmitReimbursements = (role) => role === roles.PARENT || role === roles.ADMIN;
export const canApproveReimbursements = (role) => role === roles.ADMIN;
