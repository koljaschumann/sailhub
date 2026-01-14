// E-Mail-Konfiguration für alle Module
// Später durch modulspezifische E-Mail-Adressen ersetzen

export const EMAIL_CONFIG = {
  // Admin-Benachrichtigungen (Standard)
  admin: 'kolja.schumann@aitema.de',

  // Modulspezifisch (später anpassen)
  eventRegistration: 'kolja.schumann@aitema.de',  // → Jugendwart
  charterBooking: 'kolja.schumann@aitema.de',     // → Bootswart
  fundingApplication: 'kolja.schumann@aitema.de', // → Vorstand/Kassenwart
  donations: 'kolja.schumann@aitema.de',          // → Kassenwart
  damageReport: 'kolja.schumann@aitema.de',       // → Materialwart + Jugendwart
};

// Vereinsstandort für Entfernungsberechnung
export const CLUB_LOCATION = {
  name: 'Tegeler Segel-Club',
  address: 'Schwarzer Weg 27, 13505 Berlin',
  latitude: 52.5833,  // Tegeler See
  longitude: 13.2833,
  postalCode: '13505',
};

// Disclaimer-Texte
export const DISCLAIMER_TEXTS = {
  eventRegistration: `Ich nehme zur Kenntnis, dass bei einer Absage weniger als 6 Wochen vor Veranstaltungsbeginn entstehende Kosten (Startgeld, Meldegebühren, ggf. Unterbringung) auf mich bzw. die Erziehungsberechtigten umgelegt werden müssen, sofern diese nicht anderweitig erstattet werden.`,

  charterPayment: `Ich überweise den Kostenbeitrag von 250 Euro auf das Konto der Jugendabteilung.`,

  donationPrivacy: `Ich habe die Datenschutzerklärung gelesen und akzeptiere die Verarbeitung meiner Daten zum Zweck der Spendenabwicklung.`,
};

// Charter-Gründe
export const CHARTER_REASONS = {
  alter: 'Neuanschaffung lohnt sich nicht mehr (baldiger Umstieg in nächste Bootsklasse)',
  finanziell: 'Finanzielle Schwierigkeiten bei der Anschaffung eines eigenen Bootes',
  einstieg: 'Einstieg in den Regattasport (Testphase)',
  sonstiges: 'Sonstiger Grund',
};

// Spenden-Verwendungszwecke
export const DONATION_PURPOSES = {
  allgemein: 'Allgemeine Jugendarbeit',
  regatta: 'Regattaunterstützung',
  boote: 'Bootsanschaffung',
  trainingslager: 'Trainingslager',
  sonstiges: 'Sonstiges',
};

export default EMAIL_CONFIG;
