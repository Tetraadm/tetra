-- ============================================================================
-- SECURITY FIX: PROFILES UPDATE POLICY CONSOLIDATION
-- Migration: 31_profiles_policy_cleanup.sql
-- Date: 2026-01-20
-- ============================================================================
-- Addresses audit finding F-01: Multiple permissive UPDATE policies on profiles
-- table can allow privilege escalation due to Supabase OR-semantics.
--
-- This migration ensures only the secure "Update profiles" policy from
-- 30_profiles_update_lock.sql remains active.
-- ============================================================================

-- Drop any duplicate UPDATE policies that may have been created by earlier migrations
-- The secure policy "Update profiles" with WITH CHECK constraints is preserved
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their org" ON public.profiles;

-- Verify the secure policy exists (created by 30_profiles_update_lock.sql)
-- If it doesn't exist, recreate it here as a safety measure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
          AND policyname = 'Update profiles'
          AND cmd = 'UPDATE'
    ) THEN
        -- Recreate the secure policy
        CREATE POLICY "Update profiles"
          ON public.profiles FOR UPDATE
          USING (
            id = (SELECT auth.uid())
            OR EXISTS (
              SELECT 1
              FROM public.get_profile_context((SELECT auth.uid())) pc
              WHERE pc.role = 'admin'
                AND pc.org_id = profiles.org_id
            )
          )
          WITH CHECK (
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM public.get_profile_context((SELECT auth.uid())) pc
                WHERE pc.role = 'admin'
                  AND pc.org_id = profiles.org_id
              ) THEN true
              WHEN id = (SELECT auth.uid()) THEN (
                role = (SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
                AND org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
                AND team_id IS NOT DISTINCT FROM (SELECT p.team_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
              )
              ELSE false
            END
          );
        
        COMMENT ON POLICY "Update profiles" ON public.profiles IS 
        'Users can update their own profile (except role/org_id/team_id). Admins can update any profile in their org.';
    END IF;
END $$;

-- Add a comment documenting the cleanup
COMMENT ON TABLE public.profiles IS 
'User profiles with secure UPDATE policy preventing privilege escalation. See 31_profiles_policy_cleanup.sql.';
