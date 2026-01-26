-- ============================================================================
-- TETRIVO HMS - 03_functions.sql
-- ============================================================================
-- KJØR ETTER: 02_schema.sql
-- Alle RPC-funksjoner med SECURITY DEFINER og SET search_path.
-- ============================================================================

-- ============================================================================
-- SECURITY HELPER: get_profile_context
-- Bypasses RLS to prevent recursion when policies check org/team
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_profile_context(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role TEXT,
  org_id UUID,
  team_id UUID,
  created_at TIMESTAMPTZ,
  org_name TEXT,
  team_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Prevent cross-user data access
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.role,
    p.org_id,
    p.team_id,
    p.created_at,
    o.name AS org_name,
    t.name AS team_name
  FROM public.profiles p
  LEFT JOIN public.organizations o ON o.id = p.org_id
  LEFT JOIN public.teams t ON t.id = p.team_id
  WHERE p.id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_profile_context IS 
'SECURITY DEFINER: Returns user profile with org/team names. Used by RLS policies.';

-- ============================================================================
-- SECURITY HELPER: get_user_instructions
-- Returns published instructions for user based on team membership
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_instructions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  severity TEXT,
  file_path TEXT,
  folder_id UUID,
  created_at TIMESTAMPTZ,
  keywords JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  -- SECURITY: Prevent cross-user data access
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE profiles.id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    i.id,
    i.title,
    i.content,
    i.severity,
    i.file_path,
    i.folder_id,
    i.created_at,
    i.keywords
  FROM public.instructions i
  WHERE i.org_id = v_profile.org_id
    AND i.deleted_at IS NULL
    AND i.status = 'published'
    AND (
      -- User has team and instruction is assigned to their team
      (v_profile.team_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM public.instruction_teams it
         WHERE it.instruction_id = i.id
         AND it.team_id = v_profile.team_id
       ))
      OR
      -- Instruction has no team assignments (visible to all in org)
      NOT EXISTS (
        SELECT 1 FROM public.instruction_teams it
        WHERE it.instruction_id = i.id
      )
    )
  ORDER BY i.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_instructions IS 
'SECURITY DEFINER: Returns published instructions for user based on team membership.';

-- ============================================================================
-- SECURITY HELPER: get_user_alerts
-- Returns active alerts for user based on team membership
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_alerts(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  severity TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  -- SECURITY: Prevent cross-user data access
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE profiles.id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    a.id,
    a.title,
    a.description,
    a.severity,
    a.active,
    a.created_at
  FROM public.alerts a
  WHERE a.org_id = v_profile.org_id
    AND a.active = TRUE
    AND (
      (v_profile.team_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM public.alert_teams at
         WHERE at.alert_id = a.id
         AND at.team_id = v_profile.team_id
       ))
      OR
      NOT EXISTS (
        SELECT 1 FROM public.alert_teams at
        WHERE at.alert_id = a.id
      )
    )
  ORDER BY 
    CASE a.severity 
      WHEN 'critical' THEN 1 
      WHEN 'medium' THEN 2 
      ELSE 3 
    END,
    a.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_alerts IS 
'SECURITY DEFINER: Returns active alerts for user based on team membership.';

-- ============================================================================
-- INVITE FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  token TEXT,
  org_id UUID,
  team_id UUID,
  role TEXT,
  used BOOLEAN,
  created_at TIMESTAMPTZ,
  organization_name TEXT,
  team_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.token,
    i.org_id,
    i.team_id,
    i.role,
    i.used,
    i.created_at,
    o.name AS organization_name,
    t.name AS team_name
  FROM public.invites i
  LEFT JOIN public.organizations o ON o.id = i.org_id
  LEFT JOIN public.teams t ON t.id = i.team_id
  WHERE i.token = p_token
    AND i.used = FALSE
    AND i.created_at > NOW() - INTERVAL '7 days'
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_invite_by_token IS 
'SECURITY DEFINER: Returns invite details by token. Only unused invites <7 days old.';

-- ============================================================================
-- ACCEPT INVITE
-- Creates/updates profile from invite, marks invite as used
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_invite(
  p_token TEXT,
  p_full_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites%ROWTYPE;
  v_user_id UUID;
  v_email TEXT;
  v_full_name TEXT;
  v_existing_org UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Resolve email from JWT claims
  SELECT current_setting('request.jwt.claims', TRUE)::JSON ->> 'email'
  INTO v_email;

  -- Find valid, unused invite (max age 7 days)
  SELECT *
  INTO v_invite
  FROM public.invites
  WHERE token = p_token
    AND used = FALSE
    AND created_at > NOW() - INTERVAL '7 days'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_invite';
  END IF;

  -- SECURITY: Check if user already has a profile in a DIFFERENT org
  SELECT org_id INTO v_existing_org
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_existing_org IS NOT NULL AND v_existing_org <> v_invite.org_id THEN
    RAISE EXCEPTION 'already_member_of_different_org';
  END IF;

  v_full_name := COALESCE(NULLIF(p_full_name, ''), split_part(COALESCE(v_email, ''), '@', 1), 'Bruker');

  -- Upsert profile with role/org/team from invite
  INSERT INTO public.profiles (id, full_name, email, role, org_id, team_id)
  VALUES (v_user_id, v_full_name, v_email, v_invite.role, v_invite.org_id, v_invite.team_id)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        org_id = EXCLUDED.org_id,
        team_id = EXCLUDED.team_id;

  -- Mark invite as used
  UPDATE public.invites
  SET used = TRUE
  WHERE id = v_invite.id;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.accept_invite IS 
'SECURITY DEFINER: Accepts invite and creates profile. Validates token age and usage.';

-- ============================================================================
-- READ CONFIRMATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_read_confirmations(
  p_instruction_id UUID
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  team_name TEXT,
  confirmed BOOLEAN,
  confirmed_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_org UUID;
  v_caller_role TEXT;
  v_instruction_org UUID;
BEGIN
  -- Get caller context
  SELECT pc.org_id, pc.role INTO v_caller_org, v_caller_role
  FROM public.get_profile_context(auth.uid()) pc;

  -- SECURITY: Only admins can view read confirmations
  IF v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Get instruction org
  SELECT i.org_id INTO v_instruction_org
  FROM public.instructions i
  WHERE i.id = p_instruction_id;

  -- SECURITY: Instruction must be in caller's org
  IF v_instruction_org IS NULL OR v_instruction_org <> v_caller_org THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    ir.user_id,
    p.full_name,
    t.name AS team_name,
    ir.confirmed,
    ir.confirmed_at,
    ir.read_at
  FROM public.instruction_reads ir
  JOIN public.profiles p ON p.id = ir.user_id
  LEFT JOIN public.teams t ON t.id = p.team_id
  WHERE ir.instruction_id = p_instruction_id
    AND ir.org_id = v_caller_org
  ORDER BY ir.confirmed_at DESC NULLS LAST;
END;
$$;

COMMENT ON FUNCTION public.get_read_confirmations IS 
'SECURITY DEFINER: Returns read confirmations for instruction. Admin only.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Public functions (for invite flow)
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO anon, authenticated;

-- Authenticated functions
GRANT EXECUTE ON FUNCTION public.get_profile_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_instructions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_alerts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_read_confirmations(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify all functions exist:
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;
-- ============================================================================
