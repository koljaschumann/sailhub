-- =============================================
-- TSC Jugendplattform - Erweiterungsmodule
-- Migration 004: Eventanmeldung, Saison-Charter,
--                Jugendleistungsfonds, Spendenportal, Jahresauswertung
-- =============================================

-- =============================================
-- BOAT_CLASSES: Erweiterung der bestehenden Tabelle
-- =============================================

-- Neue Spalten hinzufügen (falls nicht vorhanden)
ALTER TABLE public.boat_classes
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS min_age INTEGER,
  ADD COLUMN IF NOT EXISTS max_age INTEGER,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Display-Namen aktualisieren
UPDATE public.boat_classes SET display_name = name WHERE display_name IS NULL;

-- Zusätzliche Bootsklassen einfügen
INSERT INTO public.boat_classes (id, name, display_name, color, crew_size, min_age, max_age, sort_order, active) VALUES
  ('ilca4', 'ILCA 4', 'ILCA 4', '#14b8a6', 1, 12, 18, 7, true),
  ('ilca6', 'ILCA 6', 'ILCA 6', '#0891b2', 1, 14, NULL, 8, true),
  ('ilca7', 'ILCA 7', 'ILCA 7', '#0284c7', 1, 16, NULL, 9, true),
  ('420er', '420er', '420er', '#f59e0b', 2, 12, 18, 10, true),
  ('europe', 'Europe', 'Europe', '#a855f7', 1, 12, 18, 11, true),
  ('optimist', 'Optimist', 'Optimist', '#22c55e', 1, 7, 15, 0, true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  min_age = EXCLUDED.min_age,
  max_age = EXCLUDED.max_age,
  active = EXCLUDED.active;

-- =============================================
-- MODUL 1: EVENTANMELDUNG (Regatta-Anmeldung)
-- =============================================

-- Events-Tabelle erweitern
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS registration_deadline DATE,
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'regatta',
  ADD COLUMN IF NOT EXISTS is_championship BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS championship_level TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Check Constraints hinzufügen (wenn noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_event_type_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_event_type_check
      CHECK (event_type IN ('regatta', 'training', 'trainingslager', 'sonstiges'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_championship_level_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_championship_level_check
      CHECK (championship_level IN ('landesmeisterschaft', 'deutsche_meisterschaft', 'internationale_meisterschaft', NULL));
  END IF;
END $$;

-- Regatta-Anmeldungen
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,

  -- Hauptsegler
  sailor_first_name TEXT NOT NULL,
  sailor_last_name TEXT NOT NULL,
  sailor_birth_date DATE NOT NULL,
  boat_class_id TEXT REFERENCES public.boat_classes(id),
  sail_number TEXT,

  -- Kontakt
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Disclaimer
  disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  disclaimer_accepted_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'angemeldet' CHECK (status IN ('angemeldet', 'bestaetigt', 'abgesagt', 'teilgenommen')),
  cancellation_date TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_cost_applicable BOOLEAN,

  -- Benutzer-Referenz (falls eingeloggt)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew-Mitglieder für Mehrpersonenboote
CREATE TABLE IF NOT EXISTS public.event_registration_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  role TEXT DEFAULT 'crew' CHECK (role IN ('steuermann', 'vorschoter', 'crew')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Eventanmeldung
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_registration ON public.event_registration_crew(registration_id);

-- Trigger für updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.event_registrations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- MODUL 2: SAISON-CHARTER
-- =============================================

-- Charter-Saisons
CREATE TABLE IF NOT EXISTS public.charter_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  charter_fee DECIMAL(10,2) DEFAULT 250.00,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year)
);

-- Charter-Boote (Vereinsboote für Charter)
CREATE TABLE IF NOT EXISTS public.charter_boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_class_id TEXT REFERENCES public.boat_classes(id),
  name TEXT NOT NULL,
  sail_number TEXT,
  condition TEXT DEFAULT 'gut' CHECK (condition IN ('sehr_gut', 'gut', 'ausreichend', 'reparaturbedürftig')),
  available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charter-Buchungen
CREATE TABLE IF NOT EXISTS public.charter_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.charter_seasons(id),

  -- Segler
  sailor_name TEXT NOT NULL,
  sailor_birth_date DATE NOT NULL,
  boat_class_id TEXT REFERENCES public.boat_classes(id),

  -- Erziehungsberechtigte
  guardian_name TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  guardian_phone TEXT,

  -- Charter-Details
  charter_reason TEXT NOT NULL CHECK (charter_reason IN ('alter', 'finanziell', 'einstieg', 'sonstiges')),
  charter_reason_details TEXT,

  -- Bestätigungen
  payment_confirmed BOOLEAN NOT NULL DEFAULT false,
  payment_confirmed_at TIMESTAMPTZ,
  needs_financial_support BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'beantragt' CHECK (status IN ('beantragt', 'genehmigt', 'boot_zugewiesen', 'aktiv', 'beendet', 'abgelehnt')),
  assigned_boat_id UUID REFERENCES public.charter_boats(id),
  admin_notes TEXT,

  -- Benutzer-Referenz
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Charter
CREATE INDEX IF NOT EXISTS idx_charter_season ON public.charter_bookings(season_id);
CREATE INDEX IF NOT EXISTS idx_charter_status ON public.charter_bookings(status);
CREATE INDEX IF NOT EXISTS idx_charter_user ON public.charter_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_charter_boats_class ON public.charter_boats(boat_class_id);

-- Trigger für updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.charter_bookings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.charter_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Aktuelle Saison einfügen
INSERT INTO public.charter_seasons (year, name, start_date, end_date, charter_fee, active)
VALUES (2025, 'Saison 2025', '2025-04-01', '2025-10-31', 250.00, true)
ON CONFLICT (year) DO NOTHING;

-- =============================================
-- MODUL 3: JUGENDLEISTUNGSFONDS (Förderantrag)
-- =============================================

-- Förderanträge
CREATE TABLE IF NOT EXISTS public.funding_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Antragsteller
  sailor_name TEXT NOT NULL,
  sailor_birth_date DATE,
  boat_class_id TEXT REFERENCES public.boat_classes(id),
  sail_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Förderdetails
  measure_description TEXT NOT NULL,
  requested_amount DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'eingereicht' CHECK (status IN ('eingereicht', 'in_pruefung', 'genehmigt', 'teilweise_genehmigt', 'abgelehnt', 'ausgezahlt')),
  approved_amount DECIMAL(10,2),
  decision_date TIMESTAMPTZ,
  decision_notes TEXT,
  payment_date TIMESTAMPTZ,

  -- Intern
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),

  -- Benutzer-Referenz
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kostenplan-Positionen
CREATE TABLE IF NOT EXISTS public.funding_cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dokumente zum Antrag
CREATE TABLE IF NOT EXISTS public.funding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  document_type TEXT CHECK (document_type IN ('angebot', 'rechnung', 'sonstiges')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Förderanträge
CREATE INDEX IF NOT EXISTS idx_funding_status ON public.funding_applications(status);
CREATE INDEX IF NOT EXISTS idx_funding_user ON public.funding_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_cost_app ON public.funding_cost_items(application_id);
CREATE INDEX IF NOT EXISTS idx_funding_docs_app ON public.funding_documents(application_id);

-- Trigger für updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.funding_applications;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.funding_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- MODUL 4: SPENDENPORTAL
-- =============================================

-- Spenden
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Spender
  donor_first_name TEXT NOT NULL,
  donor_last_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,

  -- Adresse (für Spendenquittung)
  donor_street TEXT,
  donor_postal_code TEXT,
  donor_city TEXT,

  -- Spende
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  purpose TEXT,
  purpose_details TEXT,

  -- Optionen
  receipt_requested BOOLEAN DEFAULT false,
  receipt_sent BOOLEAN DEFAULT false,
  receipt_sent_at TIMESTAMPTZ,
  newsletter_consent BOOLEAN DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT true,
  privacy_accepted_at TIMESTAMPTZ,

  -- Zahlung
  payment_provider TEXT,
  payment_method TEXT,
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_completed_at TIMESTAMPTZ,

  -- Intern
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Spenden
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_receipt ON public.donations(receipt_requested, receipt_sent);
CREATE INDEX IF NOT EXISTS idx_donations_email ON public.donations(donor_email);

-- Trigger für updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.donations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- MODUL 5: JAHRESAUSWERTUNG (Ehrungen)
-- =============================================

-- Geocoding-Cache für Entfernungsberechnung
CREATE TABLE IF NOT EXISTS public.geocoded_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name TEXT NOT NULL UNIQUE,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geocoded_name ON public.geocoded_locations(location_name);

-- Regatta-Entries erweitern für Jahresauswertung
ALTER TABLE public.regatta_entries
  ADD COLUMN IF NOT EXISTS regatta_location TEXT,
  ADD COLUMN IF NOT EXISTS is_championship BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS championship_level TEXT,
  ADD COLUMN IF NOT EXISTS sailor_birth_date DATE;

-- Check Constraint für championship_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'regatta_entries_championship_level_check'
  ) THEN
    ALTER TABLE public.regatta_entries
      ADD CONSTRAINT regatta_entries_championship_level_check
      CHECK (championship_level IN ('landesmeisterschaft', 'deutsche_meisterschaft', 'internationale_meisterschaft', NULL));
  END IF;
END $$;

-- Tabelle für gespeicherte Jahresauswertungen
CREATE TABLE IF NOT EXISTS public.yearly_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  sailor_name TEXT NOT NULL,
  value TEXT,
  details JSONB,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, category)
);

CREATE INDEX IF NOT EXISTS idx_yearly_awards_year ON public.yearly_awards(year);

-- View für Jahresstatistiken
CREATE OR REPLACE VIEW public.yearly_statistics AS
SELECT
  EXTRACT(YEAR FROM re.regatta_date)::INTEGER as year,
  s.name as sailor_name,
  re.sailor_birth_date,
  s.boat_class,
  COUNT(DISTINCT re.id) as total_regattas,
  COALESCE(SUM(re.race_count), 0) as total_races,
  MIN(
    CASE
      WHEN re.total_participants > 0
      THEN re.placement::float / re.total_participants
      ELSE NULL
    END
  ) as best_relative_placement,
  MIN(re.placement) as best_absolute_placement,
  COUNT(CASE WHEN re.is_championship THEN 1 END) as championship_participations,
  ARRAY_AGG(DISTINCT re.regatta_location) FILTER (WHERE re.regatta_location IS NOT NULL) as locations,
  ARRAY_AGG(DISTINCT re.regatta_name) as regatta_names
FROM public.regatta_entries re
LEFT JOIN public.sailors s ON re.sailor_id = s.id
WHERE re.status IN ('approved', 'paid')
  AND re.regatta_date IS NOT NULL
GROUP BY
  EXTRACT(YEAR FROM re.regatta_date),
  s.name,
  re.sailor_birth_date,
  s.boat_class;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Event Registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann eigene Anmeldungen sehen" ON public.event_registrations
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Jeder kann Anmeldungen erstellen" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Eigene Anmeldungen bearbeiten" ON public.event_registrations
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Admins können Anmeldungen löschen" ON public.event_registrations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Event Registration Crew
ALTER TABLE public.event_registration_crew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew-Mitglieder über Registration" ON public.event_registration_crew
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations er
      WHERE er.id = registration_id
      AND (er.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
      ))
    )
  );

-- Charter Bookings
ALTER TABLE public.charter_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigene Charter-Buchungen sehen" ON public.charter_bookings
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Charter-Buchungen erstellen" ON public.charter_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Eigene Charter-Buchungen bearbeiten" ON public.charter_bookings
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

-- Charter Boats (nur lesbar für alle, bearbeitbar für Admins)
ALTER TABLE public.charter_boats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Charter-Boote lesen" ON public.charter_boats
  FOR SELECT USING (true);

CREATE POLICY "Admins verwalten Charter-Boote" ON public.charter_boats
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Charter Seasons
ALTER TABLE public.charter_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Charter-Saisons lesen" ON public.charter_seasons
  FOR SELECT USING (true);

CREATE POLICY "Admins verwalten Charter-Saisons" ON public.charter_seasons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Funding Applications
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigene Förderanträge sehen" ON public.funding_applications
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

CREATE POLICY "Förderanträge erstellen" ON public.funding_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Eigene Förderanträge bearbeiten" ON public.funding_applications
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
  );

-- Funding Cost Items
ALTER TABLE public.funding_cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kostenplan über Antrag" ON public.funding_cost_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.funding_applications fa
      WHERE fa.id = application_id
      AND (fa.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
      ))
    )
  );

-- Funding Documents
ALTER TABLE public.funding_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dokumente über Antrag" ON public.funding_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.funding_applications fa
      WHERE fa.id = application_id
      AND (fa.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')
      ))
    )
  );

-- Donations (nur Admins können sehen, jeder kann erstellen)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins sehen Spenden" ON public.donations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Spenden erstellen" ON public.donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins bearbeiten Spenden" ON public.donations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Geocoded Locations (öffentlich lesbar)
ALTER TABLE public.geocoded_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Geocoded Locations lesen" ON public.geocoded_locations
  FOR SELECT USING (true);

CREATE POLICY "Geocoded Locations einfügen" ON public.geocoded_locations
  FOR INSERT WITH CHECK (true);

-- Yearly Awards
ALTER TABLE public.yearly_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yearly Awards lesen" ON public.yearly_awards
  FOR SELECT USING (true);

CREATE POLICY "Admins verwalten Yearly Awards" ON public.yearly_awards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- GRANT STATEMENTS
-- =============================================

GRANT ALL ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registration_crew TO authenticated;
GRANT ALL ON public.charter_bookings TO authenticated;
GRANT ALL ON public.charter_boats TO authenticated;
GRANT ALL ON public.charter_seasons TO authenticated;
GRANT ALL ON public.funding_applications TO authenticated;
GRANT ALL ON public.funding_cost_items TO authenticated;
GRANT ALL ON public.funding_documents TO authenticated;
GRANT ALL ON public.donations TO authenticated;
GRANT ALL ON public.geocoded_locations TO authenticated;
GRANT ALL ON public.yearly_awards TO authenticated;

-- Für anonyme Benutzer (Spendenportal, Eventanmeldung ohne Login)
GRANT INSERT ON public.donations TO anon;
GRANT INSERT ON public.event_registrations TO anon;
GRANT INSERT ON public.event_registration_crew TO anon;
GRANT SELECT ON public.boat_classes TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.charter_seasons TO anon;
