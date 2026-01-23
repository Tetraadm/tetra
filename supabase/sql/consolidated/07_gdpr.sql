-- ============================================================================
-- TETRIVO HMS - 07_gdpr.sql
-- ============================================================================
-- KJØR ETTER: 06_storage.sql
-- GDPR-compliant data handling:
-- 1. Data retention (90-day auto-cleanup)
-- 2. DSAR export (Data Subject Access Request)
-- 3. Hard delete (Right to Erasure / Right to be Forgotten)
-- 4. Scheduling instructions for pg_cron
-- ============================================================================

-- ============================================================================
-- PART 1: DATA RETENTION CLEANUP FUNCTIONS
-- GDPR Art. 5(1)(e): Storage limitation principle
-- ============================================================================

-- Cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(p_retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
  deleted_count BIGINT,
  oldest_remaining_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count BIGINT;
  v_oldest_date TIMESTAMPTZ;
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;

  WITH deleted AS (
    DELETE FROM public.audit_logs
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  SELECT MIN(created_at) INTO v_oldest_date FROM public.audit_logs;

  RETURN QUERY SELECT v_deleted_count, v_oldest_date;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 
'GDPR: Deletes audit logs older than retention period (default 90 days).';

-- Cleanup old ask tetra logs
CREATE OR REPLACE FUNCTION public.cleanup_old_ask_tetra_logs(p_retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
  deleted_count BIGINT,
  oldest_remaining_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count BIGINT;
  v_oldest_date TIMESTAMPTZ;
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;

  WITH deleted AS (
    DELETE FROM public.ask_tetra_logs
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  SELECT MIN(created_at) INTO v_oldest_date FROM public.ask_tetra_logs;

  RETURN QUERY SELECT v_deleted_count, v_oldest_date;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_ask_tetra_logs IS 
'GDPR: Deletes AI logs older than retention period (default 90 days).';

-- Cleanup old unanswered questions
CREATE OR REPLACE FUNCTION public.cleanup_old_unanswered_questions(p_retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
  deleted_count BIGINT,
  oldest_remaining_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count BIGINT;
  v_oldest_date TIMESTAMPTZ;
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;

  WITH deleted AS (
    DELETE FROM public.ai_unanswered_questions
    WHERE created_at < v_cutoff_date
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  SELECT MIN(created_at) INTO v_oldest_date FROM public.ai_unanswered_questions;

  RETURN QUERY SELECT v_deleted_count, v_oldest_date;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_unanswered_questions IS 
'GDPR: Deletes unanswered questions older than retention period (default 90 days).';

-- Master cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_all_old_logs(p_retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
  log_type TEXT,
  deleted_count BIGINT,
  oldest_remaining_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'audit_logs'::TEXT, r.deleted_count, r.oldest_remaining_date
  FROM public.cleanup_old_audit_logs(p_retention_days) r;

  RETURN QUERY
  SELECT 'ask_tetra_logs'::TEXT, r.deleted_count, r.oldest_remaining_date
  FROM public.cleanup_old_ask_tetra_logs(p_retention_days) r;

  RETURN QUERY
  SELECT 'ai_unanswered_questions'::TEXT, r.deleted_count, r.oldest_remaining_date
  FROM public.cleanup_old_unanswered_questions(p_retention_days) r;
END;
$$;

COMMENT ON FUNCTION public.cleanup_all_old_logs IS 
'GDPR: Master cleanup function. Runs all retention cleanup tasks.';

-- ============================================================================
-- PART 2: DSAR EXPORT (Data Subject Access Request)
-- GDPR Art. 15: Right of access by the data subject
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gdpr_export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_profile JSONB;
  v_audit_logs JSONB;
  v_ai_logs JSONB;
  v_instruction_reads JSONB;
BEGIN
  -- SECURITY: Only allow users to export their own data, or admins in same org
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF auth.uid() <> p_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles admin_p
      JOIN public.profiles target_p ON target_p.org_id = admin_p.org_id
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
        AND target_p.id = p_user_id
    ) THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
  END IF;

  -- Profile data
  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Audit logs (user's actions)
  SELECT COALESCE(jsonb_agg(to_jsonb(al.*)), '[]'::JSONB) INTO v_audit_logs
  FROM public.audit_logs al
  WHERE al.user_id = p_user_id;

  -- AI logs (user's questions)
  SELECT COALESCE(jsonb_agg(to_jsonb(atl.*)), '[]'::JSONB) INTO v_ai_logs
  FROM public.ask_tetra_logs atl
  WHERE atl.user_id = p_user_id;

  -- Instruction reads
  SELECT COALESCE(jsonb_agg(to_jsonb(ir.*)), '[]'::JSONB) INTO v_instruction_reads
  FROM public.instruction_reads ir
  WHERE ir.user_id = p_user_id;

  -- Compile result
  v_result := jsonb_build_object(
    'export_date', NOW(),
    'user_id', p_user_id,
    'profile', v_profile,
    'audit_logs', v_audit_logs,
    'ai_question_logs', v_ai_logs,
    'instruction_reads', v_instruction_reads
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.gdpr_export_user_data IS 
'GDPR Art. 15: Exports all user data for DSAR compliance. Returns JSON.';

-- ============================================================================
-- PART 3: HARD DELETE (Right to Erasure)
-- GDPR Art. 17: Right to be forgotten
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gdpr_hard_delete_user(
  p_user_id UUID,
  p_confirm BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_caller_org UUID;
  v_target_org UUID;
  v_deleted_counts JSONB;
  v_profile_count INT;
  v_audit_count INT;
  v_ai_log_count INT;
  v_read_count INT;
  v_unanswered_count INT;
  v_gdpr_requests_count INT;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Get caller context
  SELECT pc.role, pc.org_id INTO v_caller_role, v_caller_org
  FROM public.get_profile_context(v_caller_id) pc;

  -- Get target org
  SELECT org_id INTO v_target_org
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if user exists
  IF v_target_org IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- SECURITY: Only admins can delete users, and only within their org
  IF v_caller_role <> 'admin' OR v_target_org <> v_caller_org THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Prevent self-deletion
  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'cannot_delete_self';
  END IF;

  -- Require explicit confirmation
  IF NOT p_confirm THEN
    RAISE EXCEPTION 'confirmation_required: Call with p_confirm=TRUE to proceed';
  END IF;

  -- Count records to be deleted
  SELECT COUNT(*) INTO v_audit_count FROM public.audit_logs WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_ai_log_count FROM public.ask_tetra_logs WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_read_count FROM public.instruction_reads WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_unanswered_count FROM public.ai_unanswered_questions WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_gdpr_requests_count FROM public.gdpr_requests WHERE user_id = p_user_id;

  -- Delete from public schema in correct order (FK dependencies)
  -- 1. Delete GDPR requests first (references profiles)
  DELETE FROM public.gdpr_requests WHERE user_id = p_user_id;
  
  -- 2. Delete activity logs
  DELETE FROM public.instruction_reads WHERE user_id = p_user_id;
  DELETE FROM public.ask_tetra_logs WHERE user_id = p_user_id;
  DELETE FROM public.ai_unanswered_questions WHERE user_id = p_user_id;
  DELETE FROM public.audit_logs WHERE user_id = p_user_id;
  
  -- 3. Delete profile last (CASCADE will handle any remaining FKs)
  DELETE FROM public.profiles WHERE id = p_user_id;

  GET DIAGNOSTICS v_profile_count = ROW_COUNT;

  -- Log the deletion action (admin who deleted)
  -- GDPR: Anonymize user_id using hash to prevent PII in audit log
  INSERT INTO public.audit_logs (org_id, user_id, action_type, entity_type, entity_id, details)
  VALUES (
    v_caller_org,
    v_caller_id,
    'gdpr_hard_delete',
    'user',
    NULL, -- Don't store actual user_id
    jsonb_build_object(
      'deleted_user_hash', md5(p_user_id::TEXT), -- Anonymized reference
      'audit_logs_deleted', v_audit_count,
      'ai_logs_deleted', v_ai_log_count,
      'instruction_reads_deleted', v_read_count,
      'unanswered_questions_deleted', v_unanswered_count,
      'gdpr_requests_deleted', v_gdpr_requests_count
    )
  );

  v_deleted_counts := jsonb_build_object(
    'success', TRUE,
    'deleted_user_id', p_user_id,
    'profile_deleted', v_profile_count > 0,
    'audit_logs_deleted', v_audit_count,
    'ai_logs_deleted', v_ai_log_count,
    'instruction_reads_deleted', v_read_count,
    'unanswered_questions_deleted', v_unanswered_count,
    'gdpr_requests_deleted', v_gdpr_requests_count,
    'note', 'IMPORTANT: auth.users entry must be deleted separately via Supabase Dashboard or Admin API'
  );

  RETURN v_deleted_counts;
END;
$$;

COMMENT ON FUNCTION public.gdpr_hard_delete_user IS 
'GDPR Art. 17: Hard deletes all user data. Admin only. Requires confirm=TRUE.';

-- ============================================================================
-- SECURITY: RESTRICT CLEANUP FUNCTION ACCESS
-- Only service role or pg_cron can execute cleanup functions
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_logs(INTEGER) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_ask_tetra_logs(INTEGER) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_unanswered_questions(INTEGER) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_all_old_logs(INTEGER) FROM public, authenticated;

-- Grant cleanup functions to service_role (for API routes and pg_cron)
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_ask_tetra_logs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_unanswered_questions(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_all_old_logs(INTEGER) TO service_role;

-- DSAR and hard delete are for authenticated users (with internal security checks)
GRANT EXECUTE ON FUNCTION public.gdpr_export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gdpr_hard_delete_user(UUID, BOOLEAN) TO authenticated;

-- ============================================================================
-- PART 4: SCHEDULING WITH PG_CRON (Optional - Pro plan+)
-- ============================================================================

-- To enable scheduled cleanup, run these commands manually:
--
-- 1. Enable pg_cron extension:
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule monthly cleanup (1st of each month at 02:00 UTC):
--    SELECT cron.schedule(
--      'gdpr-retention-cleanup',
--      '0 2 1 * *',
--      $$SELECT * FROM public.cleanup_all_old_logs(90)$$
--    );
--
-- 3. View scheduled jobs:
--    SELECT * FROM cron.job;
--
-- 4. Unschedule if needed:
--    SELECT cron.unschedule('gdpr-retention-cleanup');
--

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check how much data would be deleted (DRY RUN):
-- SELECT 
--   'audit_logs'::TEXT AS table_name,
--   COUNT(*) AS would_delete
-- FROM public.audit_logs
-- WHERE created_at < NOW() - INTERVAL '90 days'
-- UNION ALL
-- SELECT 'ask_tetra_logs', COUNT(*)
-- FROM public.ask_tetra_logs
-- WHERE created_at < NOW() - INTERVAL '90 days'
-- UNION ALL
-- SELECT 'ai_unanswered_questions', COUNT(*)
-- FROM public.ai_unanswered_questions
-- WHERE created_at < NOW() - INTERVAL '90 days';

-- Check current log date ranges:
-- SELECT 
--   'audit_logs' AS table_name,
--   MIN(created_at) AS oldest,
--   MAX(created_at) AS newest,
--   COUNT(*) AS total
-- FROM public.audit_logs
-- UNION ALL
-- SELECT 'ask_tetra_logs', MIN(created_at), MAX(created_at), COUNT(*)
-- FROM public.ask_tetra_logs
-- UNION ALL
-- SELECT 'ai_unanswered_questions', MIN(created_at), MAX(created_at), COUNT(*)
-- FROM public.ai_unanswered_questions;

-- View retention run history:
-- SELECT * FROM public.gdpr_retention_runs ORDER BY run_at DESC LIMIT 10;

-- ============================================================================
-- PART 5: AUTH.USERS DELETION (Manual Process Required)
-- ============================================================================
-- 
-- The gdpr_hard_delete_user() function deletes all data in public schema,
-- but Supabase Auth (auth.users) requires separate deletion:
--
-- OPTION 1: Supabase Dashboard
-- 1. Go to Authentication → Users
-- 2. Find the user by email
-- 3. Click the three dots → Delete user
--
-- OPTION 2: Supabase Admin API (from backend)
-- const { error } = await supabase.auth.admin.deleteUser(userId)
--
-- OPTION 3: Management API (curl)
-- curl -X DELETE 'https://<project>.supabase.co/auth/v1/admin/users/<user_id>' \
--   -H 'Authorization: Bearer <service_role_key>'
--
-- NOTE: Always run gdpr_hard_delete_user() BEFORE deleting from auth.users,
-- as auth.users deletion will CASCADE to profiles.
-- ============================================================================

-- ============================================================================
-- PART 6: STORAGE FILES IN DSAR (Documentation)
-- ============================================================================
--
-- The gdpr_export_user_data() function exports database records only.
-- If users have uploaded files to storage (e.g., profile pictures, documents),
-- these must be handled separately:
--
-- FILES ARE STORED AS: {org_id}/{filename}
-- 
-- To include storage files in DSAR export:
-- 1. Query storage.objects for files matching org_id
-- 2. Download files via signed URLs or service role
-- 3. Include in export package
--
-- Example query to find user's files (if file naming includes user_id):
-- SELECT name, created_at, metadata
-- FROM storage.objects
-- WHERE bucket_id = 'instructions'
-- AND name LIKE '%<user_id>%';
--
-- NOTE: In Tetrivo, instruction files are org-level, not user-level.
-- Therefore, no user-specific files need to be included in DSAR.
-- If this changes, update gdpr_export_user_data() accordingly.
-- ============================================================================

