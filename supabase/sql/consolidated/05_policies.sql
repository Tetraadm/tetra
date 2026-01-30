-- ============================================================================
-- TETRIVO HMS - 05_policies.sql
-- ============================================================================
-- KJOR ETTER: 04_triggers.sql
-- SINGLE SOURCE OF TRUTH for all RLS policies.
--
-- PERFORMANCE OPTIMIZATIONS (2026-01-28):
-- 1. All auth.uid() calls use subquery pattern: (SELECT auth.uid())
-- 2. ALL policies split into specific INSERT/UPDATE/DELETE to avoid overlap
-- 3. Single SELECT policy per table (no duplicate permissive policies)
-- 4. Uses get_my_role(), get_my_org_id(), get_my_team_id() helper functions
-- ============================================================================

-- ============================================================================
-- DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================

-- organizations
DROP POLICY IF EXISTS "Read own org" ON public.organizations;
DROP POLICY IF EXISTS "Admin update org" ON public.organizations;

-- teams
DROP POLICY IF EXISTS "Read org teams" ON public.teams;
DROP POLICY IF EXISTS "View teams" ON public.teams;
DROP POLICY IF EXISTS "Admins manage teams" ON public.teams;
DROP POLICY IF EXISTS "Admins insert teams" ON public.teams;
DROP POLICY IF EXISTS "Admins update teams" ON public.teams;
DROP POLICY IF EXISTS "Admins delete teams" ON public.teams;

-- profiles
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teamleader read team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin read org profiles" ON public.profiles;
DROP POLICY IF EXISTS "View profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;

-- folders
DROP POLICY IF EXISTS "Read org folders" ON public.folders;
DROP POLICY IF EXISTS "View org folders" ON public.folders;
DROP POLICY IF EXISTS "View folders" ON public.folders;
DROP POLICY IF EXISTS "Admins manage folders" ON public.folders;
DROP POLICY IF EXISTS "Admins insert folders" ON public.folders;
DROP POLICY IF EXISTS "Admins update folders" ON public.folders;
DROP POLICY IF EXISTS "Admins delete folders" ON public.folders;

-- instructions
DROP POLICY IF EXISTS "Users view published instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins view all instructions" ON public.instructions;
DROP POLICY IF EXISTS "View instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins manage instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins insert instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins update instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins delete instructions" ON public.instructions;

-- instruction_teams
DROP POLICY IF EXISTS "Users view instruction teams" ON public.instruction_teams;
DROP POLICY IF EXISTS "View instruction teams" ON public.instruction_teams;
DROP POLICY IF EXISTS "Admins manage instruction teams" ON public.instruction_teams;
DROP POLICY IF EXISTS "Admins insert instruction teams" ON public.instruction_teams;
DROP POLICY IF EXISTS "Admins update instruction teams" ON public.instruction_teams;
DROP POLICY IF EXISTS "Admins delete instruction teams" ON public.instruction_teams;

-- instruction_reads
DROP POLICY IF EXISTS "Users insert own reads" ON public.instruction_reads;
DROP POLICY IF EXISTS "Users update own reads" ON public.instruction_reads;
DROP POLICY IF EXISTS "Users view own reads" ON public.instruction_reads;
DROP POLICY IF EXISTS "Users read own instruction reads" ON public.instruction_reads;
DROP POLICY IF EXISTS "Admins view org reads" ON public.instruction_reads;
DROP POLICY IF EXISTS "Admins view all reads" ON public.instruction_reads;
DROP POLICY IF EXISTS "Teamleaders view team reads" ON public.instruction_reads;
DROP POLICY IF EXISTS "View instruction reads" ON public.instruction_reads;

-- alerts
DROP POLICY IF EXISTS "Users view active alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "View alerts" ON public.alerts;
DROP POLICY IF EXISTS "View org alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins manage alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins delete alerts" ON public.alerts;

-- alert_teams
DROP POLICY IF EXISTS "Users view alert teams" ON public.alert_teams;
DROP POLICY IF EXISTS "View alert teams" ON public.alert_teams;
DROP POLICY IF EXISTS "View org alert teams" ON public.alert_teams;
DROP POLICY IF EXISTS "Admins manage alert teams" ON public.alert_teams;
DROP POLICY IF EXISTS "Admins insert alert teams" ON public.alert_teams;
DROP POLICY IF EXISTS "Admins update alert teams" ON public.alert_teams;
DROP POLICY IF EXISTS "Admins delete alert teams" ON public.alert_teams;

-- invites
DROP POLICY IF EXISTS "Admins manage invites" ON public.invites;

-- audit_logs
DROP POLICY IF EXISTS "Users insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;

-- ask_tetrivo_logs
DROP POLICY IF EXISTS "Users insert ask tetrivo logs" ON public.ask_tetrivo_logs;
DROP POLICY IF EXISTS "Admins view ask tetrivo logs" ON public.ask_tetrivo_logs;

-- ai_unanswered_questions
DROP POLICY IF EXISTS "Users insert unanswered questions" ON public.ai_unanswered_questions;
DROP POLICY IF EXISTS "Admins view unanswered questions" ON public.ai_unanswered_questions;

-- gdpr_retention_runs
DROP POLICY IF EXISTS "Admins view retention runs" ON public.gdpr_retention_runs;

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

CREATE POLICY "Read own org"
  ON public.organizations FOR SELECT
  USING (
    id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "Admin update org"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = organizations.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = organizations.id
    )
  );

-- ============================================================================
-- TEAMS POLICIES (split to avoid overlap)
-- ============================================================================

CREATE POLICY "View teams"
  ON public.teams FOR SELECT
  USING (org_id = get_my_org_id());

CREATE POLICY "Admins insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins update teams"
  ON public.teams FOR UPDATE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id())
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins delete teams"
  ON public.teams FOR DELETE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id());

-- ============================================================================
-- PROFILES POLICIES
-- SECURITY: Field locking prevents privilege escalation
-- ============================================================================

-- Consolidated SELECT policy (combines own/admin/teamleader access)
CREATE POLICY "View profiles"
  ON public.profiles FOR SELECT
  USING (
    id = (SELECT auth.uid())
    OR (get_my_role() = 'admin' AND org_id = get_my_org_id())
    OR (get_my_role() = 'teamleader' AND team_id = get_my_team_id())
  );

-- CRITICAL: This policy locks role, org_id, team_id for non-admins
CREATE POLICY "Update profiles"
  ON public.profiles FOR UPDATE
  USING (
    id = (SELECT auth.uid())
    OR (get_my_role() = 'admin' AND org_id = get_my_org_id())
  )
  WITH CHECK (
    CASE
      WHEN (get_my_role() = 'admin' AND org_id = get_my_org_id()) THEN TRUE
      WHEN id = (SELECT auth.uid()) THEN (
        role = get_my_role()
        AND org_id = get_my_org_id()
        AND team_id IS NOT DISTINCT FROM get_my_team_id()
      )
      ELSE FALSE
    END
  );

COMMENT ON POLICY "Update profiles" ON public.profiles IS
'SECURITY: Non-admins cannot change role/org_id/team_id (prevents privilege escalation).';

CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id());

-- ============================================================================
-- FOLDERS POLICIES (split to avoid overlap)
-- ============================================================================

CREATE POLICY "View folders"
  ON public.folders FOR SELECT
  USING (org_id = get_my_org_id());

CREATE POLICY "Admins insert folders"
  ON public.folders FOR INSERT
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins update folders"
  ON public.folders FOR UPDATE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id())
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins delete folders"
  ON public.folders FOR DELETE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id());

-- ============================================================================
-- INSTRUCTIONS POLICIES (split to avoid overlap)
-- ============================================================================

-- Consolidated SELECT: admins see all, others see published only
-- Consolidated SELECT: admins see all, others see published only
CREATE POLICY "View instructions"
  ON public.instructions FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND (
      get_my_role() = 'admin'
      OR (
        status = 'published' 
        AND deleted_at IS NULL
        AND (
          -- Visible if NOT assigned to any team (org-wide)
          NOT EXISTS (SELECT 1 FROM instruction_teams it WHERE it.instruction_id = id)
          OR
          -- Visible if assigned to MY team
          (get_my_team_id() IS NOT NULL AND EXISTS (
            SELECT 1 FROM instruction_teams it
            WHERE it.instruction_id = id
            AND it.team_id = get_my_team_id()
          ))
        )
      )
    )
  );

CREATE POLICY "Admins insert instructions"
  ON public.instructions FOR INSERT
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins update instructions"
  ON public.instructions FOR UPDATE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id())
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins delete instructions"
  ON public.instructions FOR DELETE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id());

-- ============================================================================
-- INSTRUCTION_TEAMS POLICIES (split to avoid overlap)
-- ============================================================================

CREATE POLICY "View instruction teams"
  ON public.instruction_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instructions i
      WHERE i.id = instruction_teams.instruction_id
        AND i.org_id = get_my_org_id()
    )
  );

CREATE POLICY "Admins insert instruction teams"
  ON public.instruction_teams FOR INSERT
  WITH CHECK (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM instructions i
      WHERE i.id = instruction_teams.instruction_id
        AND i.org_id = get_my_org_id()
    )
  );

CREATE POLICY "Admins update instruction teams"
  ON public.instruction_teams FOR UPDATE
  USING (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM instructions i
      WHERE i.id = instruction_teams.instruction_id
        AND i.org_id = get_my_org_id()
    )
  )
  WITH CHECK (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM instructions i
      WHERE i.id = instruction_teams.instruction_id
        AND i.org_id = get_my_org_id()
    )
  );

CREATE POLICY "Admins delete instruction teams"
  ON public.instruction_teams FOR DELETE
  USING (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM instructions i
      WHERE i.id = instruction_teams.instruction_id
        AND i.org_id = get_my_org_id()
    )
  );

-- ============================================================================
-- INSTRUCTION_READS POLICIES
-- ============================================================================

CREATE POLICY "Users insert own reads"
  ON public.instruction_reads FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND org_id = get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM instructions i
      WHERE i.id = instruction_reads.instruction_id
        AND i.org_id = instruction_reads.org_id
        AND i.status = 'published'
        AND (
          -- Verify user actually has access to this instruction
          get_my_role() = 'admin'
          OR
          NOT EXISTS (SELECT 1 FROM instruction_teams it WHERE it.instruction_id = i.id)
          OR
          (get_my_team_id() IS NOT NULL AND EXISTS (
            SELECT 1 FROM instruction_teams it
            WHERE it.instruction_id = i.id
            AND it.team_id = get_my_team_id()
          ))
        )
    )
  );

CREATE POLICY "Users update own reads"
  ON public.instruction_reads FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND org_id IN (SELECT org_id FROM profiles WHERE id = (SELECT auth.uid()))
  );

-- Consolidated SELECT: own/admin/teamleader access
CREATE POLICY "View instruction reads"
  ON public.instruction_reads FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR (get_my_role() = 'admin' AND org_id = get_my_org_id())
    OR (
      get_my_role() = 'teamleader'
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = instruction_reads.user_id
        AND p.team_id = get_my_team_id()
      )
    )
  );

-- ============================================================================
-- ALERTS POLICIES (split to avoid overlap)
-- ============================================================================

-- Consolidated SELECT: admins see all, others see active only
CREATE POLICY "View org alerts"
  ON public.alerts FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND (
      get_my_role() = 'admin' 
      OR (
        active = true
        AND (
          -- Visible if NOT assigned to any team (org-wide)
          NOT EXISTS (SELECT 1 FROM alert_teams at WHERE at.alert_id = id)
          OR
          -- Visible if assigned to MY team
          (get_my_team_id() IS NOT NULL AND EXISTS (
            SELECT 1 FROM alert_teams at
            WHERE at.alert_id = id
            AND at.team_id = get_my_team_id()
          ))
        )
      )
    )
  );

CREATE POLICY "Admins insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins update alerts"
  ON public.alerts FOR UPDATE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id())
  WITH CHECK (get_my_role() = 'admin' AND org_id = get_my_org_id());

CREATE POLICY "Admins delete alerts"
  ON public.alerts FOR DELETE
  USING (get_my_role() = 'admin' AND org_id = get_my_org_id());

-- ============================================================================
-- ALERT_TEAMS POLICIES (split to avoid overlap)
-- ============================================================================

CREATE POLICY "View org alert teams"
  ON public.alert_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_teams.alert_id
        AND a.org_id = get_my_org_id()
    )
  );

CREATE POLICY "Admins insert alert teams"
  ON public.alert_teams FOR INSERT
  WITH CHECK (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_teams.alert_id
        AND a.org_id = get_my_org_id()
    )
  );

CREATE POLICY "Admins update alert teams"
  ON public.alert_teams FOR UPDATE
  USING (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_teams.alert_id
        AND a.org_id = get_my_org_id()
    )
  )
  WITH CHECK (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_teams.alert_id
        AND a.org_id = get_my_org_id()
    )
  );

CREATE POLICY "Admins delete alert teams"
  ON public.alert_teams FOR DELETE
  USING (
    get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.id = alert_teams.alert_id
        AND a.org_id = get_my_org_id()
    )
  );

-- ============================================================================
-- INVITES POLICIES
-- ============================================================================

CREATE POLICY "Admins manage invites"
  ON public.invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = invites.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = invites.org_id
    )
  );

-- ============================================================================
-- AUDIT_LOGS POLICIES
-- GDPR: Users can insert (for logging), only admins can read
-- ============================================================================

CREATE POLICY "Users insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = audit_logs.org_id
    )
  );

-- ============================================================================
-- ASK_TETRIVO_LOGS POLICIES
-- ============================================================================

CREATE POLICY "Users insert ask tetrivo logs"
  ON public.ask_tetrivo_logs FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins view ask tetrivo logs"
  ON public.ask_tetrivo_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = ask_tetrivo_logs.org_id
    )
  );

-- ============================================================================
-- AI_UNANSWERED_QUESTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users insert unanswered questions"
  ON public.ai_unanswered_questions FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins view unanswered questions"
  ON public.ai_unanswered_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = ai_unanswered_questions.org_id
    )
  );

-- ============================================================================
-- GDPR_RETENTION_RUNS POLICIES
-- ============================================================================

CREATE POLICY "Admins view retention runs"
  ON public.gdpr_retention_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify all policies exist:
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- ============================================================================
