-- ============================================================================
-- ADD FK INDEXES
-- ============================================================================
-- Restore indexes to cover foreign keys flagged as unindexed.

create index if not exists idx_ai_unanswered_questions_org_id
  on public.ai_unanswered_questions (org_id);

create index if not exists idx_ai_unanswered_questions_user_id
  on public.ai_unanswered_questions (user_id);

create index if not exists idx_alert_teams_team_id
  on public.alert_teams (team_id);

create index if not exists idx_ask_tetra_logs_source_instruction_id
  on public.ask_tetra_logs (source_instruction_id);

create index if not exists idx_ask_tetra_logs_user_id
  on public.ask_tetra_logs (user_id);

create index if not exists idx_audit_logs_user_id
  on public.audit_logs (user_id);

create index if not exists idx_folders_org_id
  on public.folders (org_id);

create index if not exists idx_instruction_teams_team_id
  on public.instruction_teams (team_id);

create index if not exists idx_instructions_created_by
  on public.instructions (created_by);

create index if not exists idx_instructions_folder_id
  on public.instructions (folder_id);

create index if not exists idx_invites_org_id
  on public.invites (org_id);

create index if not exists idx_invites_team_id
  on public.invites (team_id);
