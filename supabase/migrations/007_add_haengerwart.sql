-- Migration: 007_add_haengerwart
-- Adds is_haengerwart field to profiles table for damage report management permissions

-- Add is_haengerwart column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_haengerwart BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_haengerwart IS 'Indicates if user is a trailer/equipment manager (Hängerwart) with special permissions for damage reports';

-- Create partial index for faster lookups of Hängerwarte
CREATE INDEX IF NOT EXISTS idx_profiles_is_haengerwart
ON public.profiles(is_haengerwart)
WHERE is_haengerwart = true;
