-- ============================================================================
-- GDPR DATA RETENTION POLICY
-- Migration: 29_gdpr_retention.sql
-- Date: 2026-01-19
-- ============================================================================
-- This migration implements GDPR-compliant data retention:
-- 1. Cleanup functions for old audit_logs (90 days)
-- 2. Cleanup functions for old ask_tetra_logs (90 days)
-- 3. Cleanup functions for ai_unanswered_questions (90 days)
-- 4. Indexes for efficient cleanup queries
-- 5. Documentation for manual/scheduled execution
-- ============================================================================

-- ============================================================================
-- PART 1: ADD INDEXES FOR EFFICIENT CLEANUP QUERIES
-- ============================================================================

-- Index on audit_logs.created_at for efficient date-based cleanup
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON public.audit_logs (created_at DESC);

-- Index on ask_tetra_logs.created_at for efficient date-based cleanup
CREATE INDEX IF NOT EXISTS idx_ask_tetra_logs_created_at
ON public.ask_tetra_logs (created_at DESC);

-- Index on ai_unanswered_questions.created_at for efficient date-based cleanup
CREATE INDEX IF NOT EXISTS idx_ai_unanswered_questions_created_at
ON public.ai_unanswered_questions (created_at DESC);

-- ============================================================================
-- PART 2: CLEANUP FUNCTION FOR AUDIT LOGS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(p_retention_days integer DEFAULT 90)
RETURNS TABLE (
  deleted_count bigint,
  oldest_remaining_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count bigint;
  v_oldest_date timestamptz;
  v_cutoff_date timestamptz;
BEGIN
  -- Calculate cutoff date
  v_cutoff_date := NOW() - (p_retention_days || ' days')::interval;

  -- Delete old logs
  WITH deleted AS (
    DELETE FROM public.audit_logs
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Get oldest remaining log date
  SELECT MIN(created_at) INTO v_oldest_date
  FROM public.audit_logs;

  RETURN QUERY SELECT v_deleted_count, v_oldest_date;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 
'Deletes audit logs older than specified retention period (default 90 days). Returns count of deleted records and oldest remaining date.';

-- ============================================================================
-- PART 3: CLEANUP FUNCTION FOR ASK TETRA LOGS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_ask_tetra_logs(p_retention_days integer DEFAULT 90)
RETURNS TABLE (
  deleted_count bigint,
  oldest_remaining_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count bigint;
  v_oldest_date timestamptz;
  v_cutoff_date timestamptz;
BEGIN
  -- Calculate cutoff date
  v_cutoff_date := NOW() - (p_retention_days || ' days')::interval;

  -- Delete old logs
  WITH deleted AS (
    DELETE FROM public.ask_tetra_logs
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Get oldest remaining log date
  SELECT MIN(created_at) INTO v_oldest_date
  FROM public.ask_tetra_logs;

  RETURN QUERY SELECT v_deleted_count, v_oldest_date;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_ask_tetra_logs IS 
'Deletes AI assistant logs older than specified retention period (default 90 days). Returns count of deleted records and oldest remaining date.';

-- ============================================================================
-- PART 4: CLEANUP FUNCTION FOR AI UNANSWERED QUESTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_unanswered_questions(p_retention_days integer DEFAULT 90)
RETURNS TABLE (
  deleted_count bigint,
  oldest_remaining_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count bigint;
  v_oldest_date timestamptz;
  v_cutoff_date timestamptz;
BEGIN
  -- Calculate cutoff date
  v_cutoff_date := NOW() - (p_retention_days || ' days')::interval;

  -- Delete old unanswered questions
  WITH deleted AS (
    DELETE FROM public.ai_unanswered_questions
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  -- Get oldest remaining date
  SELECT MIN(created_at) INTO v_oldest_date
  FROM public.ai_unanswered_questions;

  RETURN QUERY SELECT v_deleted_count, v_oldest_date;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_unanswered_questions IS 
'Deletes unanswered AI questions older than specified retention period (default 90 days). Returns count of deleted records and oldest remaining date.';

-- ============================================================================
-- PART 5: MASTER CLEANUP FUNCTION (runs all cleanup tasks)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_all_old_logs(p_retention_days integer DEFAULT 90)
RETURNS TABLE (
  log_type text,
  deleted_count bigint,
  oldest_remaining_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cleanup audit logs
  RETURN QUERY
  SELECT 
    'audit_logs'::text,
    r.deleted_count,
    r.oldest_remaining_date
  FROM public.cleanup_old_audit_logs(p_retention_days) r;

  -- Cleanup ask tetra logs
  RETURN QUERY
  SELECT 
    'ask_tetra_logs'::text,
    r.deleted_count,
    r.oldest_remaining_date
  FROM public.cleanup_old_ask_tetra_logs(p_retention_days) r;

  -- Cleanup unanswered questions
  RETURN QUERY
  SELECT 
    'ai_unanswered_questions'::text,
    r.deleted_count,
    r.oldest_remaining_date
  FROM public.cleanup_old_unanswered_questions(p_retention_days) r;
END;
$$;

COMMENT ON FUNCTION public.cleanup_all_old_logs IS 
'Master cleanup function that runs all log cleanup tasks. Returns summary for each log type.';

-- ============================================================================
-- SECURITY: RESTRICT CLEANUP FUNCTION ACCESS
-- ============================================================================
-- These functions should only be callable by service role (server-side) or pg_cron.
-- Revoking from public and authenticated prevents privilege abuse.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_logs(integer) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_ask_tetra_logs(integer) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_unanswered_questions(integer) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_all_old_logs(integer) FROM public, authenticated;

-- ============================================================================
-- GDPR COMPLIANCE DOCUMENTATION
-- ============================================================================

-- Add retention policy metadata table for audit trail
CREATE TABLE IF NOT EXISTS public.gdpr_retention_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz DEFAULT NOW() NOT NULL,
  retention_days integer NOT NULL,
  audit_logs_deleted bigint,
  ask_tetra_logs_deleted bigint,
  unanswered_questions_deleted bigint,
  executed_by uuid REFERENCES auth.users(id),
  notes text
);

COMMENT ON TABLE public.gdpr_retention_runs IS 
'Audit trail for GDPR data retention cleanup runs. Logs when cleanup was executed and how many records were deleted.';

-- Enable RLS on retention runs table
ALTER TABLE public.gdpr_retention_runs ENABLE ROW LEVEL SECURITY;

-- Only admins can view retention runs
CREATE POLICY "Admins can view retention runs"
  ON public.gdpr_retention_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

-- ============================================================================
-- USAGE INSTRUCTIONS (for admin documentation)
-- ============================================================================

-- MANUAL EXECUTION (run as needed):
--
-- 1. Run cleanup for default 90 days:
--    SELECT * FROM public.cleanup_all_old_logs();
--
-- 2. Run cleanup with custom retention (e.g., 30 days):
--    SELECT * FROM public.cleanup_all_old_logs(30);
--
-- 3. Check what would be deleted (DRY RUN):
--    SELECT 
--      'audit_logs'::text AS log_type,
--      COUNT(*) AS would_delete
--    FROM public.audit_logs
--    WHERE created_at < NOW() - INTERVAL '90 days'
--    UNION ALL
--    SELECT 
--      'ask_tetra_logs'::text,
--      COUNT(*)
--    FROM public.ask_tetra_logs
--    WHERE created_at < NOW() - INTERVAL '90 days'
--    UNION ALL
--    SELECT 
--      'ai_unanswered_questions'::text,
--      COUNT(*)
--    FROM public.ai_unanswered_questions
--    WHERE created_at < NOW() - INTERVAL '90 days';
--
-- 4. Log cleanup run to audit trail:
--    WITH cleanup AS (
--      SELECT * FROM public.cleanup_all_old_logs(90)
--    )
--    INSERT INTO public.gdpr_retention_runs (
--      retention_days,
--      audit_logs_deleted,
--      ask_tetra_logs_deleted,
--      unanswered_questions_deleted,
--      executed_by,
--      notes
--    )
--    SELECT
--      90,
--      MAX(CASE WHEN log_type = 'audit_logs' THEN deleted_count ELSE 0 END),
--      MAX(CASE WHEN log_type = 'ask_tetra_logs' THEN deleted_count ELSE 0 END),
--      MAX(CASE WHEN log_type = 'ai_unanswered_questions' THEN deleted_count ELSE 0 END),
--      auth.uid(),
--      'Scheduled cleanup run'
--    FROM cleanup;
--
-- ============================================================================
-- AUTOMATED EXECUTION (optional - requires pg_cron extension)
-- ============================================================================
--
-- If you have pg_cron enabled on Supabase (Pro plan and above):
--
-- 1. Enable pg_cron extension:
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule monthly cleanup (runs on 1st of each month at 2 AM):
--    SELECT cron.schedule(
--      'gdpr-retention-cleanup',
--      '0 2 1 * *',  -- At 02:00 on day-of-month 1
--      $$SELECT * FROM public.cleanup_all_old_logs(90)$$
--    );
--
-- 3. View scheduled jobs:
--    SELECT * FROM cron.job;
--
-- 4. Unschedule (if needed):
--    SELECT cron.unschedule('gdpr-retention-cleanup');
--
-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
--
-- Check current oldest log dates:
-- SELECT 
--   'audit_logs' AS table_name,
--   MIN(created_at) AS oldest_date,
--   MAX(created_at) AS newest_date,
--   COUNT(*) AS total_logs
-- FROM public.audit_logs
-- UNION ALL
-- SELECT 
--   'ask_tetra_logs',
--   MIN(created_at),
--   MAX(created_at),
--   COUNT(*)
-- FROM public.ask_tetra_logs
-- UNION ALL
-- SELECT 
--   'ai_unanswered_questions',
--   MIN(created_at),
--   MAX(created_at),
--   COUNT(*)
-- FROM public.ai_unanswered_questions;
--
-- Check retention run history:
-- SELECT * FROM public.gdpr_retention_runs ORDER BY run_at DESC LIMIT 10;
--
-- ============================================================================
