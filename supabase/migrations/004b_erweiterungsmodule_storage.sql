-- =============================================
-- TSC Jugendplattform - Storage Buckets für Erweiterungsmodule
-- =============================================

-- Bucket für Förderantrag-Dokumente (privat)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'funding-documents',
  'funding-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies für funding-documents

-- Authentifizierte Benutzer können hochladen
CREATE POLICY "Authentifizierte können Dokumente hochladen" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'funding-documents');

-- Eigene Dokumente lesen (über application_id im Pfad)
CREATE POLICY "Eigene Dokumente lesen" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND (
      -- Prüfen ob Benutzer Zugriff auf die Application hat
      EXISTS (
        SELECT 1 FROM public.funding_applications fa
        WHERE fa.id::text = (storage.foldername(name))[1]
        AND (
          fa.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
        )
      )
    )
  );

-- Eigene Dokumente löschen
CREATE POLICY "Eigene Dokumente löschen" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND EXISTS (
      SELECT 1 FROM public.funding_applications fa
      WHERE fa.id::text = (storage.foldername(name))[1]
      AND (
        fa.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );
