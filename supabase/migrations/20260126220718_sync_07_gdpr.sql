-- sync consolidated 07_gdpr
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

  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = p_user_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(al.*)), '[]'::JSONB) INTO v_audit_logs
  FROM public.audit_logs al
  WHERE al.user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(atl.*)), '[]'::JSONB) INTO v_ai_logs
  FROM public.ask_tetra_logs atl
  WHERE atl.user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(ir.*)), '[]'::JSONB) INTO v_instruction_reads
  FROM public.instruction_reads ir
  WHERE ir.user_id = p_user_id;

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

  SELECT pc.role, pc.org_id INTO v_caller_role, v_caller_org
  FROM public.get_profile_context(v_caller_id) pc;

  SELECT org_id INTO v_target_org
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_target_org IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_caller_role <> 'admin' OR v_target_org <> v_caller_org THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'cannot_delete_self';
  END IF;

  IF NOT p_confirm THEN
    RAISE EXCEPTION 'confirmation_required: Call with p_confirm=TRUE to proceed';
  END IF;

  SELECT COUNT(*) INTO v_audit_count FROM public.audit_logs WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_ai_log_count FROM public.ask_tetra_logs WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_read_count FROM public.instruction_reads WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_unanswered_count FROM public.ai_unanswered_questions WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_gdpr_requests_count FROM public.gdpr_requests WHERE user_id = p_user_id;

  DELETE FROM public.gdpr_requests WHERE user_id = p_user_id;
  
  DELETE FROM public.instruction_reads WHERE user_id = p_user_id;
  DELETE FROM public.ask_tetra_logs WHERE user_id = p_user_id;
  DELETE FROM public.ai_unanswered_questions WHERE user_id = p_user_id;
  DELETE FROM public.audit_logs WHERE user_id = p_user_id;
  
  DELETE FROM public.profiles WHERE id = p_user_id;

  GET DIAGNOSTICS v_profile_count = ROW_COUNT;

  INSERT INTO public.audit_logs (org_id, user_id, action_type, entity_type, entity_id, details)
  VALUES (
    v_caller_org,
    v_caller_id,
    'gdpr_hard_delete',
    'user',
    NULL,
    jsonb_build_object(
      'deleted_user_hash', md5(p_user_id::TEXT),
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

REVOKE EXECUTE ON FUNCTION public.cleanup_old_audit_logs(INTEGER) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_ask_tetra_logs(INTEGER) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_unanswered_questions(INTEGER) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_all_old_logs(INTEGER) FROM public, authenticated;

GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_ask_tetra_logs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_unanswered_questions(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_all_old_logs(INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION public.gdpr_export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gdpr_hard_delete_user(UUID, BOOLEAN) TO authenticated;
