-- ============================================================================
-- RLS POLICY UPDATES (CLEANUP + CANONICAL SET)
-- ============================================================================
-- Drops legacy/duplicate policies and recreates the canonical set.

-- Organizations
drop policy if exists "Users can view their own organization" on public.organizations;
drop policy if exists "Read own org" on public.organizations;
drop policy if exists "Admin update org" on public.organizations;

create policy "Read own org"
  on public.organizations for select
  using (
    id in (select org_id from public.profiles where id = auth.uid())
  );

create policy "Admin update org"
  on public.organizations for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = organizations.id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = organizations.id
    )
  );

-- Teams
drop policy if exists "Users can view teams in their organization" on public.teams;
drop policy if exists "Read org teams" on public.teams;
drop policy if exists "Admin manage org teams" on public.teams;
drop policy if exists "Admins can manage teams" on public.teams;

create policy "Read org teams"
  on public.teams for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
  );

create policy "Admins can manage teams"
  on public.teams for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = teams.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = teams.org_id
    )
  );

-- Profiles
drop policy if exists "Users can view profiles in their organization" on public.profiles;
drop policy if exists "Admin manage org profiles" on public.profiles;
drop policy if exists "Admin read org profiles" on public.profiles;
drop policy if exists "Admins can update profiles in their org" on public.profiles;
drop policy if exists "Admins can delete profiles in their org" on public.profiles;
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Teamleader read team profiles" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;

create policy "Read own profile"
  on public.profiles for select
  using (
    id = auth.uid()
  );

create policy "Teamleader read team profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.get_profile_context(auth.uid()) pc
      where pc.role = 'teamleader'
        and pc.team_id = profiles.team_id
    )
  );

create policy "Admin read org profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.get_profile_context(auth.uid()) pc
      where pc.role = 'admin'
        and pc.org_id = profiles.org_id
    )
  );

create policy "Update own profile"
  on public.profiles for update
  using (
    id = auth.uid()
  );

create policy "Admins can update profiles in their org"
  on public.profiles for update
  using (
    exists (
      select 1
      from public.get_profile_context(auth.uid()) pc
      where pc.role = 'admin'
        and pc.org_id = profiles.org_id
    )
  );

create policy "Admins can delete profiles in their org"
  on public.profiles for delete
  using (
    exists (
      select 1
      from public.get_profile_context(auth.uid()) pc
      where pc.role = 'admin'
        and pc.org_id = profiles.org_id
    )
  );

-- Folders
drop policy if exists "Users can view folders in their organization" on public.folders;
drop policy if exists "Read org folders" on public.folders;
drop policy if exists "Admin manage org folders" on public.folders;
drop policy if exists "Admins can manage folders" on public.folders;

create policy "Read org folders"
  on public.folders for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
  );

create policy "Admins can manage folders"
  on public.folders for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = folders.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = folders.org_id
    )
  );

-- Instructions
drop policy if exists "Users can view published instructions in their org" on public.instructions;
drop policy if exists "Read published instructions (team-aware)" on public.instructions;
drop policy if exists "Admin read all instructions" on public.instructions;
drop policy if exists "Admins can view all instructions in their org" on public.instructions;
drop policy if exists "Admin manage instructions" on public.instructions;
drop policy if exists "Admins can manage instructions" on public.instructions;

create policy "Users can view published instructions in their org"
  on public.instructions for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and status = 'published'
  );

create policy "Admins can view all instructions in their org"
  on public.instructions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

create policy "Admins can manage instructions"
  on public.instructions for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

-- Instruction-team links
drop policy if exists "Admin manage instruction-team mappings" on public.instruction_teams;
drop policy if exists "Admin read instruction-team mappings" on public.instruction_teams;
drop policy if exists "Admins can manage instruction team links" on public.instruction_teams;

create policy "Admins can manage instruction team links"
  on public.instruction_teams for all
  using (
    exists (
      select 1
      from public.profiles p
      join public.instructions i on i.id = instruction_teams.instruction_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = i.org_id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      join public.instructions i on i.id = instruction_teams.instruction_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = i.org_id
    )
  );

-- Instruction reads
drop policy if exists "Admin read all read records" on public.instruction_reads;
drop policy if exists "User insert own read record (visible instruction)" on public.instruction_reads;
drop policy if exists "User read own read records" on public.instruction_reads;
drop policy if exists "User update own read record" on public.instruction_reads;
drop policy if exists "Users can insert their instruction reads" on public.instruction_reads;
drop policy if exists "Users can update their instruction reads" on public.instruction_reads;
drop policy if exists "Users can view their instruction reads" on public.instruction_reads;
drop policy if exists "Admins can view instruction reads in their org" on public.instruction_reads;

create policy "Users can insert their instruction reads"
  on public.instruction_reads for insert
  with check (
    user_id = auth.uid()
    and org_id in (select org_id from public.profiles where id = auth.uid())
    and exists (
      select 1
      from public.instructions i
      where i.id = instruction_reads.instruction_id
        and i.org_id = instruction_reads.org_id
    )
  );

create policy "Users can update their instruction reads"
  on public.instruction_reads for update
  using (
    user_id = auth.uid()
    and org_id in (select org_id from public.profiles where id = auth.uid())
    and exists (
      select 1
      from public.instructions i
      where i.id = instruction_reads.instruction_id
        and i.org_id = instruction_reads.org_id
    )
  );

create policy "Users can view their instruction reads"
  on public.instruction_reads for select
  using (
    user_id = auth.uid()
  );

create policy "Admins can view instruction reads in their org"
  on public.instruction_reads for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instruction_reads.org_id
    )
  );

-- Alerts
drop policy if exists "Read active alerts (team-aware)" on public.alerts;
drop policy if exists "Users can view active alerts in their org" on public.alerts;
drop policy if exists "Admin manage alerts" on public.alerts;
drop policy if exists "Admins can manage alerts" on public.alerts;

create policy "Users can view active alerts in their org"
  on public.alerts for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and active = true
  );

create policy "Admins can manage alerts"
  on public.alerts for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  );

-- Alert-team links
drop policy if exists "Read alert-team mappings (only for visible alerts)" on public.alert_teams;
drop policy if exists "Admin manage alert-team mappings" on public.alert_teams;
drop policy if exists "Admins can manage alert team links" on public.alert_teams;

create policy "Admins can manage alert team links"
  on public.alert_teams for all
  using (
    exists (
      select 1
      from public.profiles p
      join public.alerts a on a.id = alert_teams.alert_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = a.org_id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      join public.alerts a on a.id = alert_teams.alert_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = a.org_id
    )
  );

-- Invites
drop policy if exists "Admin manage invites" on public.invites;
drop policy if exists "Admins can manage invites" on public.invites;

create policy "Admins can manage invites"
  on public.invites for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = invites.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = invites.org_id
    )
  );

-- Audit logs
drop policy if exists "Admin read audit logs" on public.audit_logs;
drop policy if exists "Admins can view audit logs in their org" on public.audit_logs;
drop policy if exists "Admins can insert audit logs in their org" on public.audit_logs;
drop policy if exists "User insert own audit log (same org)" on public.audit_logs;
drop policy if exists "Users can insert audit logs in their org" on public.audit_logs;

create policy "Admins can view audit logs in their org"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = audit_logs.org_id
    )
  );

create policy "Users can insert audit logs in their org"
  on public.audit_logs for insert
  with check (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and (user_id is null or user_id = auth.uid())
  );

-- Ask Tetra logs
drop policy if exists "Admin read ask tetra logs" on public.ask_tetra_logs;
drop policy if exists "Admins can view ask tetra logs in their org" on public.ask_tetra_logs;
drop policy if exists "User insert own ask tetra log (same org)" on public.ask_tetra_logs;
drop policy if exists "Users can insert ask tetra logs in their org" on public.ask_tetra_logs;

create policy "Users can insert ask tetra logs in their org"
  on public.ask_tetra_logs for insert
  with check (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and (user_id is null or user_id = auth.uid())
  );

create policy "Admins can view ask tetra logs in their org"
  on public.ask_tetra_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = ask_tetra_logs.org_id
    )
  );
