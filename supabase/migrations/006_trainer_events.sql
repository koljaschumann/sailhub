-- =============================================
-- TSC Jugendplattform - Trainer Events
-- Migration 006: Neues Eventanmeldung-Konzept
-- Trainer erstellen Events für ihre Bootsklassen
-- =============================================

-- =============================================
-- TABELLE: trainer_events
-- Events die von Trainern für ihre Gruppen erstellt werden
-- =============================================

CREATE TABLE IF NOT EXISTS public.trainer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boat_class_id TEXT NOT NULL REFERENCES public.boat_classes(id),

  -- Event-Quelle: entweder aus Saisonplanung ODER manuell erstellt
  -- Wenn event_id gesetzt ist, werden Titel/Datum/Ort von dort übernommen
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  -- Für manuell erstellte Events (wenn event_id NULL):
  title TEXT,
  event_type TEXT DEFAULT 'regatta' CHECK (event_type IN ('regatta', 'trainingslager', 'training', 'sonstiges')),
  start_date DATE,
  end_date DATE,
  location TEXT,
  description TEXT,

  -- Kosten-Info (besonders wichtig für Trainingslager)
  has_costs BOOLEAN DEFAULT false,
  cost_description TEXT,
  estimated_cost DECIMAL(10,2),

  -- Storno-Regelung
  cancellation_deadline DATE,
  cancellation_fee DECIMAL(10,2) DEFAULT 0,
  cancellation_warning TEXT,

  -- Status
  registration_open BOOLEAN DEFAULT true,
  max_participants INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique Constraint: Ein Trainer kann dasselbe Event nur einmal pro Bootsklasse anbieten
CREATE UNIQUE INDEX IF NOT EXISTS idx_trainer_events_unique
  ON public.trainer_events(trainer_id, boat_class_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(title, ''));

-- Indizes
CREATE INDEX IF NOT EXISTS idx_trainer_events_trainer ON public.trainer_events(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_events_boat_class ON public.trainer_events(boat_class_id);
CREATE INDEX IF NOT EXISTS idx_trainer_events_event ON public.trainer_events(event_id);
CREATE INDEX IF NOT EXISTS idx_trainer_events_open ON public.trainer_events(registration_open) WHERE registration_open = true;

-- Trigger für updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.trainer_events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.trainer_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- EVENT_REGISTRATIONS: Erweiterung
-- Verknüpfung zu Trainer-Events
-- =============================================

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS trainer_event_id UUID REFERENCES public.trainer_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_acknowledged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_acknowledged_at TIMESTAMPTZ;

-- Index für Trainer-Event Verknüpfung
CREATE INDEX IF NOT EXISTS idx_registrations_trainer_event ON public.event_registrations(trainer_event_id);

-- =============================================
-- SAILOR_BOAT_CLASSES: Segler-Bootsklassen-Zuordnung
-- Damit Segler nur Events ihrer Klasse sehen
-- =============================================

CREATE TABLE IF NOT EXISTS public.sailor_boat_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sailor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boat_class_id TEXT NOT NULL REFERENCES public.boat_classes(id),
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(sailor_id, boat_class_id)
);

CREATE INDEX IF NOT EXISTS idx_sailor_boat_classes_sailor ON public.sailor_boat_classes(sailor_id);
CREATE INDEX IF NOT EXISTS idx_sailor_boat_classes_class ON public.sailor_boat_classes(boat_class_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- trainer_events RLS aktivieren
ALTER TABLE public.trainer_events ENABLE ROW LEVEL SECURITY;

-- Trainer können ihre eigenen Events verwalten
CREATE POLICY "trainer_events_trainer_all" ON public.trainer_events
  FOR ALL TO authenticated
  USING (
    trainer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Alle authentifizierten Benutzer können offene Events sehen
CREATE POLICY "trainer_events_select_open" ON public.trainer_events
  FOR SELECT TO authenticated
  USING (registration_open = true);

-- sailor_boat_classes RLS aktivieren
ALTER TABLE public.sailor_boat_classes ENABLE ROW LEVEL SECURITY;

-- Segler können ihre eigenen Zuordnungen sehen
CREATE POLICY "sailor_boat_classes_own" ON public.sailor_boat_classes
  FOR SELECT TO authenticated
  USING (sailor_id = auth.uid());

-- Trainer können Zuordnungen für ihre Bootsklassen sehen
CREATE POLICY "sailor_boat_classes_trainer" ON public.sailor_boat_classes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_boat_classes tbc
      WHERE tbc.trainer_id = auth.uid()
      AND tbc.boat_class_id = sailor_boat_classes.boat_class_id
    )
  );

-- Admins können alle Zuordnungen verwalten
CREATE POLICY "sailor_boat_classes_admin" ON public.sailor_boat_classes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trainer können Zuordnungen für ihre Bootsklassen erstellen
CREATE POLICY "sailor_boat_classes_trainer_insert" ON public.sailor_boat_classes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trainer_boat_classes tbc
      WHERE tbc.trainer_id = auth.uid()
      AND tbc.boat_class_id = sailor_boat_classes.boat_class_id
    )
  );

-- =============================================
-- GRANT STATEMENTS
-- =============================================

GRANT ALL ON public.trainer_events TO authenticated;
GRANT ALL ON public.sailor_boat_classes TO authenticated;

-- =============================================
-- VIEW: Trainer-Events mit vollständigen Infos
-- =============================================

CREATE OR REPLACE VIEW public.trainer_events_full AS
SELECT
  te.id,
  te.trainer_id,
  p.full_name as trainer_name,
  te.boat_class_id,
  bc.name as boat_class_name,
  bc.display_name as boat_class_display_name,
  bc.color as boat_class_color,
  te.event_id,
  -- Event-Details: von Saisonplanung oder manuell
  COALESCE(e.name, te.title) as title,
  COALESCE(e.type, te.event_type) as event_type,
  COALESCE(e.start_date, te.start_date) as start_date,
  COALESCE(e.end_date, te.end_date) as end_date,
  COALESCE(e.location, te.location) as location,
  te.description,
  -- Kosten-Info
  te.has_costs,
  te.cost_description,
  te.estimated_cost,
  -- Storno-Info
  te.cancellation_deadline,
  te.cancellation_fee,
  te.cancellation_warning,
  -- Status
  te.registration_open,
  te.max_participants,
  -- Timestamps
  te.created_at,
  te.updated_at,
  -- Aggregierte Infos
  (SELECT COUNT(*) FROM public.event_registrations er WHERE er.trainer_event_id = te.id) as registration_count
FROM public.trainer_events te
LEFT JOIN public.profiles p ON te.trainer_id = p.id
LEFT JOIN public.boat_classes bc ON te.boat_class_id = bc.id
LEFT JOIN public.events e ON te.event_id = e.id;

GRANT SELECT ON public.trainer_events_full TO authenticated;
