-- ============================================================================
-- P1 FIX: DOCUMENT PROFILE EMAIL TRIGGER
-- Migration: 23_document_profile_email_trigger.sql
-- Date: 2026-01-16
-- ============================================================================
-- This function and trigger exist in production but were missing from repo.
-- Now documented for parity between repo and live DB.
-- ============================================================================

-- set_profile_email: Syncs email from auth.users to profiles on insert/update
CREATE OR REPLACE FUNCTION public.set_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Get email from auth.users table
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger on profiles table
DROP TRIGGER IF EXISTS set_profile_email ON public.profiles;
CREATE TRIGGER set_profile_email
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_email();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_profile_email() TO authenticated;
