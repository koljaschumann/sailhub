-- TSC Jugend Plattform - Database Schema
-- Run this in the Supabase SQL Editor

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'eltern' CHECK (role IN ('admin', 'trainer', 'eltern')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRAINER - BOAT CLASS ASSIGNMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.trainer_boat_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  boat_class_id TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_id, boat_class_id)
);

-- =============================================
-- SEASONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  deadline DATE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOAT CLASSES (Reference Data)
-- =============================================
CREATE TABLE IF NOT EXISTS public.boat_classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  crew_size INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- Insert default boat classes
INSERT INTO public.boat_classes (id, name, color, crew_size, sort_order) VALUES
  ('opti-c', 'Opti C', '#22c55e', 1, 1),
  ('opti-b', 'Opti B', '#3b82f6', 1, 2),
  ('opti-a', 'Opti A', '#8b5cf6', 1, 3),
  ('29er', '29er', '#f59e0b', 2, 4),
  ('pirat', 'Pirat', '#ec4899', 2, 5),
  ('j70', 'J70', '#06b6d4', 4, 6)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- MOTORBOATS (Reference Data)
-- =============================================
CREATE TABLE IF NOT EXISTS public.motorboats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  priority_classes TEXT[]
);

-- Insert default motorboats
INSERT INTO public.motorboats (id, name, description, priority_classes) VALUES
  ('tornado-rot', 'Tornado rot', 'Schnellstes Boot', ARRAY['29er', 'j70']),
  ('tornado-grau', 'Tornado grau', 'Schnelles Boot', ARRAY['29er', 'j70']),
  ('narwhal', 'Narwhal', 'Keine Priorisierung', ARRAY[]::TEXT[]),
  ('zodiac', 'Zodiac', 'Keine Priorisierung', ARRAY[]::TEXT[])
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EVENTS (Regattas & Training Camps)
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  boat_class_id TEXT REFERENCES public.boat_classes(id),
  trainer_id UUID REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('regatta', 'trainingslager')),
  name TEXT NOT NULL,
  organizer TEXT,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  motorboat_loading_time TIMESTAMPTZ,
  requested_motorboat TEXT REFERENCES public.motorboats(id),
  assigned_motorboat TEXT REFERENCES public.motorboats(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SAILORS (for Startgelder module)
-- =============================================
CREATE TABLE IF NOT EXISTS public.sailors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sail_number TEXT,
  boat_class TEXT,
  iban TEXT,
  account_holder TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CREW MEMBERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.crew_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sailor_id UUID REFERENCES public.sailors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  boat_class TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REGATTA ENTRIES (Startgeld Reimbursements)
-- =============================================
CREATE TABLE IF NOT EXISTS public.regatta_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sailor_id UUID REFERENCES public.sailors(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  regatta_name TEXT NOT NULL,
  regatta_date DATE,
  boat_class TEXT,
  placement INTEGER,
  total_participants INTEGER,
  race_count INTEGER,
  invoice_amount DECIMAL(10,2),
  crew_members TEXT[],
  pdf_result_path TEXT,
  pdf_invoice_path TEXT,
  manage2sail_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS: Updated At
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.seasons;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.sailors;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sailors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.regatta_entries;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.regatta_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- FUNCTION: Create profile on user signup
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'eltern'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
