-- ============================================================================
-- DROP UNUSED INDEXES
-- ============================================================================
-- Remove indexes flagged as unused by pg_stat_user_indexes.

drop index if exists public.idx_instructions_keywords;
drop index if exists public.idx_instructions_created_by;
drop index if exists public.idx_instructions_folder_id;
drop index if exists public.idx_instructions_severity;
drop index if exists public.idx_instructions_file_path;

drop index if exists public.idx_ask_tetra_logs_user_id;
drop index if exists public.idx_ask_tetra_logs_source_instruction_id;

drop index if exists public.idx_audit_logs_user_id;
drop index if exists public.idx_audit_logs_created_at;

drop index if exists public.idx_ai_unanswered_questions_org_id;
drop index if exists public.idx_ai_unanswered_questions_user_id;

drop index if exists public.idx_invites_org_id;
drop index if exists public.idx_invites_team_id;

drop index if exists public.idx_alert_teams_team_id;
drop index if exists public.idx_instruction_teams_team_id;

drop index if exists public.idx_folders_org_id;
