-- ============================================================================
-- TETRIVO HMS - 05_policies.sql
-- ============================================================================
-- KJØR ETTER: 04_triggers.sql
-- SINGLE SOURCE OF TRUTH for all RLS policies.
-- All policies use WITH CHECK for write operations (least privilege).
-- ============================================================================

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
-- TEAMS POLICIES
-- ============================================================================

CREATE POLICY "Read org teams"
  ON public.teams FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins manage teams"
  ON public.teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = teams.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = teams.org_id
    )
  );

-- ============================================================================
-- PROFILES POLICIES
-- SECURITY: Field locking prevents privilege escalation
-- ============================================================================

CREATE POLICY "Read own profile"
  ON public.profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Teamleader read team profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.get_profile_context((SELECT auth.uid())) pc
      WHERE pc.role = 'teamleader'
        AND pc.team_id = profiles.team_id
    )
  );

CREATE POLICY "Admin read org profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.get_profile_context((SELECT auth.uid())) pc
      WHERE pc.role = 'admin'
        AND pc.org_id = profiles.org_id
    )
  );

-- CRITICAL: This policy locks role, org_id, team_id for non-admins
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
      -- Admins can update anything in their org
      WHEN EXISTS (
        SELECT 1
        FROM public.get_profile_context((SELECT auth.uid())) pc
        WHERE pc.role = 'admin'
          AND pc.org_id = profiles.org_id
      ) THEN TRUE
      -- Non-admins: lock sensitive fields
      WHEN id = (SELECT auth.uid()) THEN (
        role = (SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
        AND org_id = (SELECT p.org_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
        AND team_id IS NOT DISTINCT FROM (SELECT p.team_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
      )
      ELSE FALSE
    END
  );

COMMENT ON POLICY "Update profiles" ON public.profiles IS 
'SECURITY: Non-admins cannot change role/org_id/team_id (prevents privilege escalation).';

CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.get_profile_context((SELECT auth.uid())) pc
      WHERE pc.role = 'admin'
        AND pc.org_id = profiles.org_id
    )
  );

-- ============================================================================
-- FOLDERS POLICIES
-- ============================================================================

CREATE POLICY "Read org folders"
  ON public.folders FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins manage folders"
  ON public.folders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = folders.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = folders.org_id
    )
  );

-- ============================================================================
-- INSTRUCTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users view published instructions"
  ON public.instructions FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.org_id = instructions.org_id
        AND (
          (p.team_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.instruction_teams it
            WHERE it.instruction_id = instructions.id
              AND it.team_id = p.team_id
          ))
          OR NOT EXISTS (
            SELECT 1 FROM public.instruction_teams it
            WHERE it.instruction_id = instructions.id
          )
        )
    )
  );

CREATE POLICY "Admins view all instructions"
  ON public.instructions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  );

CREATE POLICY "Admins manage instructions"
  ON public.instructions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  );

-- ============================================================================
-- INSTRUCTION_TEAMS POLICIES
-- ============================================================================

CREATE POLICY "Users view instruction teams"
  ON public.instruction_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.instructions i
      JOIN public.profiles p ON p.org_id = i.org_id
      WHERE i.id = instruction_teams.instruction_id
        AND p.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins manage instruction teams"
  ON public.instruction_teams FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.instructions i ON i.id = instruction_teams.instruction_id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = i.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.instructions i ON i.id = instruction_teams.instruction_id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = i.org_id
    )
  );

-- ============================================================================
-- INSTRUCTION_READS POLICIES
-- ============================================================================

CREATE POLICY "Users insert own reads"
  ON public.instruction_reads FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.instructions i
      WHERE i.id = instruction_reads.instruction_id
        AND i.org_id = instruction_reads.org_id
        AND i.status = 'published'
    )
  );

CREATE POLICY "Users update own reads"
  ON public.instruction_reads FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "Users view own reads"
  ON public.instruction_reads FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins view org reads"
  ON public.instruction_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instruction_reads.org_id
    )
  );

-- ============================================================================
-- ALERTS POLICIES
-- ============================================================================

CREATE POLICY "Users view active alerts"
  ON public.alerts FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND active = TRUE
  );

CREATE POLICY "Admins view all alerts"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  );

CREATE POLICY "Admins manage alerts"
  ON public.alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  );

-- ============================================================================
-- ALERT_TEAMS POLICIES
-- ============================================================================

CREATE POLICY "Users view alert teams"
  ON public.alert_teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alerts a
      JOIN public.profiles p ON p.org_id = a.org_id
      WHERE a.id = alert_teams.alert_id
        AND p.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins manage alert teams"
  ON public.alert_teams FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.alerts a ON a.id = alert_teams.alert_id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = a.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.alerts a ON a.id = alert_teams.alert_id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = a.org_id
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
-- ASK_TETRA_LOGS POLICIES
-- ============================================================================

CREATE POLICY "Users insert ask tetra logs"
  ON public.ask_tetra_logs FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Admins view ask tetra logs"
  ON public.ask_tetra_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = ask_tetra_logs.org_id
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
