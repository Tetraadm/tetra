-- Fix search_path for set_updated_at and add missing FK indexes flagged by Supabase advisors.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists idx_ai_unanswered_questions_user_id
  on public.ai_unanswered_questions(user_id);
create index if not exists idx_alert_teams_team_id
  on public.alert_teams(team_id);
create index if not exists idx_ask_tetra_logs_source_instruction_id
  on public.ask_tetra_logs(source_instruction_id);
create index if not exists idx_folders_org_id
  on public.folders(org_id);
create index if not exists idx_instruction_teams_team_id
  on public.instruction_teams(team_id);
create index if not exists idx_instructions_created_by
  on public.instructions(created_by);
create index if not exists idx_invites_org_id
  on public.invites(org_id);
create index if not exists idx_invites_team_id
  on public.invites(team_id);
