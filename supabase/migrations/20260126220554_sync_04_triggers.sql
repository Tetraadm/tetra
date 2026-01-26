-- sync consolidated 04_triggers
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

DROP TRIGGER IF EXISTS trigger_instructions_updated_at ON public.instructions;

CREATE TRIGGER trigger_instructions_updated_at
  BEFORE UPDATE ON public.instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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
