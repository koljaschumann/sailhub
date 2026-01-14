-- ============================================
-- TSC-Jugendportal: Schadensmeldung Module
-- Migration: 003_schadensmeldung.sql
-- ============================================

-- Equipment Types (Segelboot, Motorboot, Bootshänger)
CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default equipment types
INSERT INTO equipment_types (name, display_name) VALUES
  ('segelboot', 'Segelboot'),
  ('motorboot', 'Motorboot'),
  ('haenger', 'Bootshänger')
ON CONFLICT (name) DO NOTHING;

-- Equipment (konkrete Boote/Hänger)
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID REFERENCES equipment_types(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Damage Reports
CREATE TABLE IF NOT EXISTS damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  reporter_name TEXT NOT NULL,
  reporter_email TEXT,
  status TEXT DEFAULT 'offen' CHECK (status IN ('offen', 'in_bearbeitung', 'erledigt')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Damage Report Photos
CREATE TABLE IF NOT EXISTS damage_report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID REFERENCES damage_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes für bessere Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_equipment_type_id ON equipment(type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment(active);
CREATE INDEX IF NOT EXISTS idx_damage_reports_equipment_id ON damage_reports(equipment_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_damage_reports_created_at ON damage_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_report_photos_report_id ON damage_report_photos(damage_report_id);

-- ============================================
-- Updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_damage_reports_updated_at ON damage_reports;
CREATE TRIGGER update_damage_reports_updated_at
  BEFORE UPDATE ON damage_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_report_photos ENABLE ROW LEVEL SECURITY;

-- Equipment Types: Jeder kann lesen
CREATE POLICY "Equipment types sind öffentlich lesbar"
  ON equipment_types FOR SELECT
  USING (true);

-- Equipment: Jeder authentifizierte User kann lesen
CREATE POLICY "Equipment ist für authentifizierte User lesbar"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

-- Equipment: Nur Admins können schreiben
CREATE POLICY "Nur Admins können Equipment verwalten"
  ON equipment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Damage Reports: Authentifizierte User können erstellen
CREATE POLICY "Authentifizierte User können Schadensmeldungen erstellen"
  ON damage_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Damage Reports: Jeder authentifizierte User kann lesen
CREATE POLICY "Authentifizierte User können Schadensmeldungen lesen"
  ON damage_reports FOR SELECT
  TO authenticated
  USING (true);

-- Damage Reports: Admins und Trainer können aktualisieren
CREATE POLICY "Admins und Trainer können Schadensmeldungen aktualisieren"
  ON damage_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'trainer')
    )
  );

-- Damage Report Photos: Gleiche Regeln wie Reports
CREATE POLICY "Authentifizierte User können Fotos erstellen"
  ON damage_report_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authentifizierte User können Fotos lesen"
  ON damage_report_photos FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Example Equipment Data
-- ============================================
-- (Auskommentiert - bei Bedarf aktivieren)

/*
INSERT INTO equipment (type_id, name, description)
SELECT
  (SELECT id FROM equipment_types WHERE name = 'segelboot'),
  name,
  description
FROM (VALUES
  ('Opti 1', 'Optimist mit rotem Segel'),
  ('Opti 2', 'Optimist mit blauem Segel'),
  ('Opti 3', 'Optimist mit weißem Segel'),
  ('420er TSC 1', 'Vereins-420er'),
  ('Laser 1', 'ILCA 6'),
  ('Laser 2', 'ILCA 7')
) AS boats(name, description);

INSERT INTO equipment (type_id, name, description)
SELECT
  (SELECT id FROM equipment_types WHERE name = 'motorboot'),
  name,
  description
FROM (VALUES
  ('Jugend 1', 'Schlauchboot mit 15PS Yamaha'),
  ('Jugend 2', 'Schlauchboot mit 20PS Mercury'),
  ('Trainer', 'RIB mit 40PS')
) AS boats(name, description);

INSERT INTO equipment (type_id, name, description)
SELECT
  (SELECT id FROM equipment_types WHERE name = 'haenger'),
  name,
  description
FROM (VALUES
  ('Opti-Hänger 1', '4er Optimist-Hänger'),
  ('Opti-Hänger 2', '6er Optimist-Hänger'),
  ('420er-Hänger', 'Doppelachser für 420er')
) AS boats(name, description);
*/
