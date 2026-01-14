// =============================================
// Gemeinsame TypeScript-Typen für alle Module
// =============================================

// =============================================
// BOOT-KLASSEN
// =============================================

export interface BoatClass {
  id: string;
  name: string;
  display_name: string;
  color: string;
  crew_size: number;
  min_age?: number;
  max_age?: number;
  sort_order: number;
  active: boolean;
}

// =============================================
// MODUL 1: EVENTANMELDUNG
// =============================================

export type EventType = 'regatta' | 'training' | 'trainingslager' | 'sonstiges';
export type ChampionshipLevel = 'landesmeisterschaft' | 'deutsche_meisterschaft' | 'internationale_meisterschaft';
export type RegistrationStatus = 'angemeldet' | 'bestaetigt' | 'abgesagt' | 'teilgenommen';
export type CrewRole = 'steuermann' | 'vorschoter' | 'crew';

export interface Event {
  id: string;
  season_id?: string;
  boat_class_id?: string;
  trainer_id?: string;
  type: EventType;
  name: string;
  organizer?: string;
  location?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  event_type: EventType;
  is_championship: boolean;
  championship_level?: ChampionshipLevel;
  external_url?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrewMember {
  id?: string;
  registration_id?: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  role: CrewRole;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  event?: Event;

  // Hauptsegler
  sailor_first_name: string;
  sailor_last_name: string;
  sailor_birth_date: string;
  boat_class_id?: string;
  boat_class?: BoatClass;
  sail_number?: string;

  // Kontakt
  contact_email: string;
  contact_phone?: string;

  // Crew
  crew_members?: CrewMember[];

  // Disclaimer
  disclaimer_accepted: boolean;
  disclaimer_accepted_at?: string;

  // Status
  status: RegistrationStatus;
  cancellation_date?: string;
  cancellation_reason?: string;
  cancellation_cost_applicable?: boolean;

  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistrationFormData {
  event_id: string;
  sailor_first_name: string;
  sailor_last_name: string;
  sailor_birth_date: string;
  boat_class_id: string;
  sail_number?: string;
  contact_email: string;
  contact_phone?: string;
  crew_members: Omit<CrewMember, 'id' | 'registration_id'>[];
  disclaimer_accepted: boolean;
}

// =============================================
// MODUL 2: SAISON-CHARTER
// =============================================

export type CharterReason = 'alter' | 'finanziell' | 'einstieg' | 'sonstiges';
export type CharterStatus = 'beantragt' | 'genehmigt' | 'boot_zugewiesen' | 'aktiv' | 'beendet' | 'abgelehnt';
export type BoatCondition = 'sehr_gut' | 'gut' | 'ausreichend' | 'reparaturbedürftig';

export interface CharterSeason {
  id: string;
  year: number;
  name: string;
  start_date: string;
  end_date: string;
  charter_fee: number;
  active: boolean;
  created_at: string;
}

export interface CharterBoat {
  id: string;
  boat_class_id?: string;
  boat_class?: BoatClass;
  name: string;
  sail_number?: string;
  condition: BoatCondition;
  available: boolean;
  notes?: string;
  created_at: string;
}

export interface CharterBooking {
  id: string;
  season_id: string;
  season?: CharterSeason;

  // Segler
  sailor_name: string;
  sailor_birth_date: string;
  boat_class_id?: string;
  boat_class?: BoatClass;

  // Erziehungsberechtigte
  guardian_name: string;
  guardian_email: string;
  guardian_phone?: string;

  // Charter-Details
  charter_reason: CharterReason;
  charter_reason_details?: string;

  // Bestätigungen
  payment_confirmed: boolean;
  payment_confirmed_at?: string;
  needs_financial_support: boolean;

  // Status
  status: CharterStatus;
  assigned_boat_id?: string;
  assigned_boat?: CharterBoat;
  admin_notes?: string;

  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CharterBookingFormData {
  season_id: string;
  sailor_name: string;
  sailor_birth_date: string;
  boat_class_id: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone?: string;
  charter_reason: CharterReason;
  charter_reason_details?: string;
  payment_confirmed: boolean;
  needs_financial_support: boolean;
}

// =============================================
// MODUL 3: JUGENDLEISTUNGSFONDS
// =============================================

export type FundingStatus = 'eingereicht' | 'in_pruefung' | 'genehmigt' | 'teilweise_genehmigt' | 'abgelehnt' | 'ausgezahlt';
export type DocumentType = 'angebot' | 'rechnung' | 'sonstiges';

export interface FundingCostItem {
  id?: string;
  application_id?: string;
  description: string;
  amount: number;
  category?: string;
}

export interface FundingDocument {
  id: string;
  application_id: string;
  storage_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  document_type?: DocumentType;
  created_at: string;
}

export interface FundingApplication {
  id: string;

  // Antragsteller
  sailor_name: string;
  sailor_birth_date?: string;
  boat_class_id?: string;
  boat_class?: BoatClass;
  sail_number?: string;
  contact_email: string;
  contact_phone?: string;

  // Förderdetails
  measure_description: string;
  requested_amount: number;
  cost_items?: FundingCostItem[];
  documents?: FundingDocument[];

  // Status
  status: FundingStatus;
  approved_amount?: number;
  decision_date?: string;
  decision_notes?: string;
  payment_date?: string;

  // Intern
  reviewer_notes?: string;
  reviewed_by?: string;

  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FundingApplicationFormData {
  sailor_name: string;
  sailor_birth_date?: string;
  boat_class_id?: string;
  sail_number?: string;
  contact_email: string;
  contact_phone?: string;
  measure_description: string;
  requested_amount: number;
  cost_items: Omit<FundingCostItem, 'id' | 'application_id'>[];
}

// =============================================
// MODUL 4: SPENDENPORTAL
// =============================================

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMethod = 'sepa' | 'card' | 'paypal' | 'google_pay' | 'apple_pay';

export interface Donation {
  id: string;

  // Spender
  donor_first_name: string;
  donor_last_name: string;
  donor_email: string;

  // Adresse
  donor_street?: string;
  donor_postal_code?: string;
  donor_city?: string;

  // Spende
  amount: number;
  currency: string;
  purpose?: string;
  purpose_details?: string;

  // Optionen
  receipt_requested: boolean;
  receipt_sent: boolean;
  receipt_sent_at?: string;
  newsletter_consent: boolean;
  privacy_accepted: boolean;
  privacy_accepted_at?: string;

  // Zahlung
  payment_provider?: string;
  payment_method?: PaymentMethod;
  payment_intent_id?: string;
  payment_status: PaymentStatus;
  payment_completed_at?: string;

  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DonationFormData {
  donor_first_name: string;
  donor_last_name: string;
  donor_email: string;
  donor_street?: string;
  donor_postal_code?: string;
  donor_city?: string;
  amount: number;
  purpose?: string;
  purpose_details?: string;
  receipt_requested: boolean;
  newsletter_consent: boolean;
  privacy_accepted: boolean;
  payment_method: PaymentMethod;
}

// =============================================
// MODUL 5: JAHRESAUSWERTUNG
// =============================================

export type AwardCategory = 'youngest' | 'most_races' | 'best_placement' | 'championships' | 'furthest_regatta';

export interface YearlyStatistic {
  year: number;
  sailor_name: string;
  sailor_birth_date?: string;
  boat_class?: string;
  total_regattas: number;
  total_races: number;
  best_relative_placement?: number;
  best_absolute_placement?: number;
  championship_participations: number;
  locations?: string[];
  regatta_names?: string[];
}

export interface YearlyAward {
  id: string;
  year: number;
  category: AwardCategory;
  sailor_name: string;
  value?: string;
  details?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

export interface GeocodedLocation {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

// =============================================
// HELPER TYPES
// =============================================

export interface Sailor {
  id?: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  boat_class_id?: string;
  sail_number?: string;
}

export interface ContactInfo {
  email: string;
  phone?: string;
}

export interface Address {
  street?: string;
  postal_code?: string;
  city?: string;
}
