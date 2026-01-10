-- ============================================================================
-- RLS POLICY UPDATES (INCREMENTAL)
-- ============================================================================
-- Run this after 01_schema.sql to enable required read/write access.
-- Safe to re-run due to DROP POLICY IF EXISTS.

-- Instructions (published for users)
drop policy if exists "Users can view published instructions in their org" on public.instructions;
create policy "Users can view published instructions in their org"
  on public.instructions for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and status = 'published'
  );

-- Folders (read)
drop policy if exists "Users can view folders in their organization" on public.folders;
create policy "Users can view folders in their organization"
  on public.folders for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
  );

-- Alerts (read active)
drop policy if exists "Users can view active alerts in their org" on public.alerts;
create policy "Users can view active alerts in their org"
  on public.alerts for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and active = true
  );

-- Admin: view all instructions
drop policy if exists "Admins can view all instructions in their org" on public.instructions;
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

-- Admin: teams
drop policy if exists "Admins can manage teams" on public.teams;
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

-- Admin: profiles
drop policy if exists "Admins can update profiles in their org" on public.profiles;
create policy "Admins can update profiles in their org"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = profiles.org_id
    )
  );

drop policy if exists "Admins can delete profiles in their org" on public.profiles;
create policy "Admins can delete profiles in their org"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = profiles.org_id
    )
  );

-- Admin: folders
drop policy if exists "Admins can manage folders" on public.folders;
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

-- Admin: instructions
drop policy if exists "Admins can manage instructions" on public.instructions;
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

-- Admin: instruction team links
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

-- Admin: alerts
drop policy if exists "Admins can manage alerts" on public.alerts;
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

-- Admin: alert team links
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

-- Admin: invites
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
drop policy if exists "Admins can view audit logs in their org" on public.audit_logs;
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

drop policy if exists "Admins can insert audit logs in their org" on public.audit_logs;
create policy "Admins can insert audit logs in their org"
  on public.audit_logs for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = audit_logs.org_id
    )
    and (user_id is null or user_id = auth.uid())
  );

-- Ask Tetra logs
drop policy if exists "Users can insert ask tetra logs in their org" on public.ask_tetra_logs;
create policy "Users can insert ask tetra logs in their org"
  on public.ask_tetra_logs for insert
  with check (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "Admins can view ask tetra logs in their org" on public.ask_tetra_logs;
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

-- Instruction reads
drop policy if exists "Users can insert their instruction reads" on public.instruction_reads;
create policy "Users can insert their instruction reads"
  on public.instruction_reads for insert
  with check (
    user_id = auth.uid()
    and org_id in (select org_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Users can update their instruction reads" on public.instruction_reads;
create policy "Users can update their instruction reads"
  on public.instruction_reads for update
  using (
    user_id = auth.uid()
  );

drop policy if exists "Users can view their instruction reads" on public.instruction_reads;
create policy "Users can view their instruction reads"
  on public.instruction_reads for select
  using (
    user_id = auth.uid()
  );

drop policy if exists "Admins can view instruction reads in their org" on public.instruction_reads;
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
