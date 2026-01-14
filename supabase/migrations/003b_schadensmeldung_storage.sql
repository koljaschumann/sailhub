-- ============================================
-- TSC-Jugendportal: Schadensmeldung Storage Buckets
-- Migration: 003b_schadensmeldung_storage.sql
-- ============================================

-- Storage Buckets erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('damage-photos', 'damage-photos', false),
  ('damage-reports-pdf', 'damage-reports-pdf', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies für damage-photos
-- ============================================

-- Authentifizierte User können Fotos hochladen
CREATE POLICY "Authentifizierte User können Schadensfotos hochladen"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'damage-photos');

-- Authentifizierte User können Fotos lesen
CREATE POLICY "Authentifizierte User können Schadensfotos lesen"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'damage-photos');

-- Service Role kann alles (für Edge Functions)
CREATE POLICY "Service kann Schadensfotos verwalten"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'damage-photos');

-- ============================================
-- Storage Policies für damage-reports-pdf
-- ============================================

-- Service Role kann PDFs erstellen (Edge Function)
CREATE POLICY "Service kann Report-PDFs erstellen"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'damage-reports-pdf');

-- Authentifizierte User können PDFs lesen
CREATE POLICY "Authentifizierte User können Report-PDFs lesen"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'damage-reports-pdf');

-- Service Role kann alles
CREATE POLICY "Service kann Report-PDFs verwalten"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'damage-reports-pdf');
