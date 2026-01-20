-- ============================================================================
-- TETRIVO HMS - 04_triggers.sql
-- ============================================================================
-- KJØR ETTER: 03_functions.sql
-- Triggers for automatisk oppdatering av felter.
-- ============================================================================

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS 
'Trigger function to auto-update updated_at column.';

-- ============================================================================
-- APPLY UPDATED_AT TRIGGER TO INSTRUCTIONS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_instructions_updated_at ON public.instructions;

CREATE TRIGGER trigger_instructions_updated_at
  BEFORE UPDATE ON public.instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- EMAIL SYNC TRIGGER
-- Syncs email from auth.users to profiles when user is created/updated
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync if email changed
  IF TG_OP = 'UPDATE' AND OLD.email = NEW.email THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_profile_email IS 
'GDPR: Syncs email from auth.users to profiles. Single source of truth.';

-- Note: This trigger must be created on auth.users which requires service role.
-- Run this separately with service role if needed:
-- CREATE TRIGGER on_auth_user_email_change
--   AFTER INSERT OR UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.sync_profile_email();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify triggers exist:
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname LIKE 'trigger_%';
-- ============================================================================
