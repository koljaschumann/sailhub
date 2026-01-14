-- TSC Jugend Plattform - Row Level Security Policies
-- Run this AFTER 001_schema.sql

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_boat_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boat_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorboats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sailors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regatta_entries ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is current user an admin?
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is current user a trainer (or admin)?
CREATE OR REPLACE FUNCTION auth.is_trainer()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('admin', 'trainer')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Does trainer have access to this boat class?
CREATE OR REPLACE FUNCTION auth.trainer_has_boat_class(class_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainer_boat_classes
    WHERE trainer_id = auth.uid() AND boat_class_id = class_id
  ) OR auth.is_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Everyone can view profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can update roles
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.is_admin());

-- =============================================
-- TRAINER_BOAT_CLASSES POLICIES
-- =============================================

-- Trainers can view their own assignments
CREATE POLICY "View own boat class assignments"
  ON public.trainer_boat_classes FOR SELECT
  TO authenticated
  USING (trainer_id = auth.uid() OR auth.is_admin());

-- Only admins can manage assignments
CREATE POLICY "Admins manage boat class assignments"
  ON public.trainer_boat_classes FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- =============================================
-- SEASONS POLICIES
-- =============================================

-- Everyone can view seasons
CREATE POLICY "Seasons are viewable by all"
  ON public.seasons FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage seasons
CREATE POLICY "Admins manage seasons"
  ON public.seasons FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- =============================================
-- BOAT_CLASSES POLICIES (Reference Data)
-- =============================================

-- Everyone can view boat classes
CREATE POLICY "Boat classes are viewable by all"
  ON public.boat_classes FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins manage boat classes"
  ON public.boat_classes FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- =============================================
-- MOTORBOATS POLICIES (Reference Data)
-- =============================================

-- Everyone can view motorboats
CREATE POLICY "Motorboats are viewable by all"
  ON public.motorboats FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins manage motorboats"
  ON public.motorboats FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- =============================================
-- EVENTS POLICIES
-- =============================================

-- Everyone can view events
CREATE POLICY "Events are viewable by all"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

-- Trainers can create events for their boat classes
CREATE POLICY "Trainers create events for their classes"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.is_trainer() AND
    auth.trainer_has_boat_class(boat_class_id)
  );

-- Trainers can update their own events (before deadline)
CREATE POLICY "Trainers update own events before deadline"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    (trainer_id = auth.uid() AND
     (SELECT deadline FROM public.seasons WHERE id = season_id) >= CURRENT_DATE)
    OR auth.is_admin()
  );

-- Trainers can delete their own events (before deadline)
CREATE POLICY "Trainers delete own events before deadline"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    (trainer_id = auth.uid() AND
     (SELECT deadline FROM public.seasons WHERE id = season_id) >= CURRENT_DATE)
    OR auth.is_admin()
  );

-- =============================================
-- SAILORS POLICIES
-- =============================================

-- Parents see only their own sailors
CREATE POLICY "Parents view own sailors"
  ON public.sailors FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid() OR auth.is_admin());

-- Parents can create sailors for themselves
CREATE POLICY "Parents create own sailors"
  ON public.sailors FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Parents can update their own sailors
CREATE POLICY "Parents update own sailors"
  ON public.sailors FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid() OR auth.is_admin());

-- Parents can delete their own sailors
CREATE POLICY "Parents delete own sailors"
  ON public.sailors FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid() OR auth.is_admin());

-- =============================================
-- CREW_MEMBERS POLICIES
-- =============================================

-- Parents see crew for their sailors
CREATE POLICY "Parents view crew for own sailors"
  ON public.crew_members FOR SELECT
  TO authenticated
  USING (
    sailor_id IN (SELECT id FROM public.sailors WHERE parent_id = auth.uid())
    OR auth.is_admin()
  );

-- Parents can manage crew for their sailors
CREATE POLICY "Parents manage crew for own sailors"
  ON public.crew_members FOR ALL
  TO authenticated
  USING (
    sailor_id IN (SELECT id FROM public.sailors WHERE parent_id = auth.uid())
    OR auth.is_admin()
  );

-- =============================================
-- REGATTA_ENTRIES POLICIES
-- =============================================

-- Parents see entries for their sailors
CREATE POLICY "Parents view own regatta entries"
  ON public.regatta_entries FOR SELECT
  TO authenticated
  USING (
    sailor_id IN (SELECT id FROM public.sailors WHERE parent_id = auth.uid())
    OR auth.is_admin()
  );

-- Parents can create entries for their sailors
CREATE POLICY "Parents create regatta entries"
  ON public.regatta_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    sailor_id IN (SELECT id FROM public.sailors WHERE parent_id = auth.uid())
  );

-- Parents can update pending entries
CREATE POLICY "Parents update pending entries"
  ON public.regatta_entries FOR UPDATE
  TO authenticated
  USING (
    sailor_id IN (SELECT id FROM public.sailors WHERE parent_id = auth.uid())
    AND status = 'pending'
  );

-- Parents can delete pending entries
CREATE POLICY "Parents delete pending entries"
  ON public.regatta_entries FOR DELETE
  TO authenticated
  USING (
    sailor_id IN (SELECT id FROM public.sailors WHERE parent_id = auth.uid())
    AND status = 'pending'
  );

-- Admins can update any entry (for approval)
CREATE POLICY "Admins manage all entries"
  ON public.regatta_entries FOR ALL
  TO authenticated
  USING (auth.is_admin());
