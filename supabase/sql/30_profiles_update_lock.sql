-- ============================================================================
-- SECURITY FIX: PROFILES UPDATE FIELD LOCKING
-- Migration: 30_profiles_update_lock.sql
-- Date: 2026-01-19
-- ============================================================================
-- Fixes privilege escalation vulnerability in profiles UPDATE policy.
-- Non-admin users could previously change their own role, org_id, or team_id.
-- This migration adds WITH CHECK constraints to lock sensitive fields.
-- ============================================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Update profiles" ON public.profiles;

-- ============================================================================
-- Recreate with field locking for non-admin users
-- ============================================================================
-- Non-admins can only update their own profile AND cannot change:
--   - role (prevents privilege escalation)
--   - org_id (prevents org-hopping)
--   - team_id (prevents team-hopping without admin approval)
-- Admins can update any profile in their org without field restrictions.
-- ============================================================================

CREATE POLICY "Update profiles"
  ON public.profiles FOR UPDATE
  USING (
    -- Who can attempt an update?
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.get_profile_context((SELECT auth.uid())) pc
      WHERE pc.role = 'admin'
        AND pc.org_id = profiles.org_id
    )
  )
  WITH CHECK (
    -- What updates are allowed?
    CASE
      -- Admins can update anything in their org
      WHEN EXISTS (
        SELECT 1
        FROM public.get_profile_context((SELECT auth.uid())) pc
        WHERE pc.role = 'admin'
          AND pc.org_id = profiles.org_id
      ) THEN true
      -- Non-admins updating their own profile: lock sensitive fields
      WHEN id = (SELECT auth.uid()) THEN (
        -- role must remain unchanged (compare with current value via subquery)
        role = (SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
        AND org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
        AND team_id IS NOT DISTINCT FROM (SELECT p.team_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
      )
      ELSE false
    END
  );

-- Add comment for documentation
COMMENT ON POLICY "Update profiles" ON public.profiles IS 
'Users can update their own profile (except role/org_id/team_id). Admins can update any profile in their org.';
