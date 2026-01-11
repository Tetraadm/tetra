-- ============================================================================
-- POLICY CONSOLIDATION
-- ============================================================================
-- Reduce multiple permissive policies by merging select/update logic and
-- splitting admin "all" policies into insert/update/delete.

-- Alerts
drop policy if exists "Users can view active alerts in their org" on public.alerts;
drop policy if exists "Admins can manage alerts" on public.alerts;

create policy "Read org alerts"
  on public.alerts for select
  using (
    (org_id = my_org_id() and active = true)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  );

create policy "Admins can insert alerts"
  on public.alerts for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  );

create policy "Admins can update alerts"
  on public.alerts for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  );

create policy "Admins can delete alerts"
  on public.alerts for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  );

-- Folders
drop policy if exists "Read org folders" on public.folders;
drop policy if exists "Admins can manage folders" on public.folders;

create policy "Read org folders"
  on public.folders for select
  using (
    org_id = my_org_id()
  );

create policy "Admins can insert folders"
  on public.folders for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = folders.org_id
    )
  );

create policy "Admins can update folders"
  on public.folders for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = folders.org_id
    )
  );

create policy "Admins can delete folders"
  on public.folders for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = folders.org_id
    )
  );

-- Teams
drop policy if exists "Read org teams" on public.teams;
drop policy if exists "Admins can manage teams" on public.teams;

create policy "Read org teams"
  on public.teams for select
  using (
    org_id = my_org_id()
  );

create policy "Admins can insert teams"
  on public.teams for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = teams.org_id
    )
  );

create policy "Admins can update teams"
  on public.teams for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = teams.org_id
    )
  );

create policy "Admins can delete teams"
  on public.teams for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = teams.org_id
    )
  );

-- Instructions
drop policy if exists "Users can view published instructions in their org" on public.instructions;
drop policy if exists "Admins can view all instructions in their org" on public.instructions;
drop policy if exists "Admins can manage instructions" on public.instructions;

create policy "Read org instructions"
  on public.instructions for select
  using (
    (org_id = my_org_id() and status = 'published')
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

create policy "Admins can insert instructions"
  on public.instructions for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

create policy "Admins can update instructions"
  on public.instructions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

create policy "Admins can delete instructions"
  on public.instructions for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

-- Instruction reads
drop policy if exists "Users can view their instruction reads" on public.instruction_reads;
drop policy if exists "Admins can view instruction reads in their org" on public.instruction_reads;

create policy "Read instruction reads"
  on public.instruction_reads for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.org_id = instruction_reads.org_id
    )
  );

-- Profiles
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Teamleader read team profiles" on public.profiles;
drop policy if exists "Admin read org profiles" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Admins can update profiles in their org" on public.profiles;

create policy "Read org profiles"
  on public.profiles for select
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.get_profile_context((select auth.uid())) pc
      where pc.role = 'teamleader'
        and pc.team_id = profiles.team_id
    )
    or exists (
      select 1
      from public.get_profile_context((select auth.uid())) pc
      where pc.role = 'admin'
        and pc.org_id = profiles.org_id
    )
  );

create policy "Update profiles"
  on public.profiles for update
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.get_profile_context((select auth.uid())) pc
      where pc.role = 'admin'
        and pc.org_id = profiles.org_id
    )
  );
